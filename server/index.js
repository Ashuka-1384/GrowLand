import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { readDB, writeDB } from './store.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === 'production';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_PHONE = normalizePhone(process.env.ADMIN_PHONE || '');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const DEFAULT_ADMIN_NAME = String(process.env.ADMIN_NAME || 'GrowLand Admin').trim().slice(0, 80) || 'GrowLand Admin';

if (isProduction && String(process.env.JWT_SECRET || '').length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters in production.');
}
if (isProduction && !process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN must be configured in production. GrowLand does not use ephemeral serverless disk as its production database.');
}
if (process.env.BLOB_READ_WRITE_TOKEN && String(process.env.BLOB_DATA_SECRET || '').length < 32) {
  throw new Error('BLOB_DATA_SECRET must be configured with at least 32 characters when Blob storage is enabled.');
}
if (isProduction && (!ADMIN_PHONE || !ADMIN_PASSWORD)) {
  throw new Error('ADMIN_PHONE and ADMIN_PASSWORD must be configured in production.');
}
function isScryptHash(value) {
  const parts = String(value || '').split('.');
  if (parts.length !== 2) return false;
  try {
    const salt = Buffer.from(parts[0], 'base64');
    const hash = Buffer.from(parts[1], 'base64');
    return salt.length >= 16 && hash.length === 64;
  } catch { return false; }
}
if (isProduction && !isScryptHash(ADMIN_PASSWORD)) {
  throw new Error('ADMIN_PASSWORD must be a scrypt hash in production. Generate it with scripts/hash-password.mjs.');
}

function normalizeOrigin(value = '') {
  try { return new URL(String(value).trim()).origin.replace(/\/$/, ''); } catch { return ''; }
}
const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map(normalizeOrigin).filter(Boolean);

function requestHost(req) {
  return String(req.headers['x-forwarded-host'] || req.get('host') || '').split(',')[0].trim().toLowerCase();
}
function isSameOrigin(req, origin) {
  try {
    const u = new URL(origin);
    return u.host.toLowerCase() === requestHost(req) && (u.protocol === 'https:' || u.protocol === 'http:');
  } catch { return false; }
}

app.set('trust proxy', 1);
app.disable('x-powered-by');

const requestHits = new Map();
function rateLimit({ windowMs = 60_000, max = 120 } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.path}`;
    const item = requestHits.get(key);
    if (!item || now - item.startedAt > windowMs) {
      requestHits.set(key, { startedAt: now, count: 1 });
      return next();
    }
    item.count += 1;
    if (item.count > max) {
      return res.status(429).json({ message: 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.' });
    }
    return next();
  };
}

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || isSameOrigin(req, origin) || allowedOrigins.includes(normalizeOrigin(origin)) || (!isProduction && allowedOrigins.length === 0)) {
    return next();
  }
  return res.status(403).json({ message: 'Origin مجاز نیست.' });
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb', strict: true }));
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Vary', 'Origin, Cookie');
  next();
});
app.use('/api', rateLimit({ windowMs: 60_000, max: 240 }));
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of requestHits) {
    if (now - item.startedAt > 300_000) requestHits.delete(key);
  }
}, 300_000).unref();

function normalizePhone(v = '') {
  let s = String(v).trim().replace(/[\s()-]/g, '');
  if (s.startsWith('0098')) s = '+98' + s.slice(4);
  if (s.startsWith('09')) s = '+98' + s.slice(1);
  if (s.startsWith('9')) s = '+98' + s;
  return s;
}
function isValidPhone(v) { return /^\+989\d{9}$/.test(normalizePhone(v)); }

function passwordHash(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt.toString('base64')}.${hash.toString('base64')}`;
}
function verifyPassword(password, stored) {
  try {
    const [salt64, hash64] = String(stored || '').split('.');
    if (!salt64 || !hash64) return false;
    const salt = Buffer.from(salt64, 'base64');
    const expected = Buffer.from(hash64, 'base64');
    const actual = crypto.scryptSync(password, salt, expected.length, { N: 16384, r: 8, p: 1 });
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
function verifyAdminPassword(password) {
  if (!validatePassword(password) || !ADMIN_PASSWORD) return false;
  // Production must use a scrypt hash; plaintext is only accepted for local development.
  if (isProduction) return verifyPassword(password, ADMIN_PASSWORD);
  return isScryptHash(ADMIN_PASSWORD) ? verifyPassword(password, ADMIN_PASSWORD) : password === ADMIN_PASSWORD;
}
function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

function calcLevel(xp) {
  return Math.max(1, Math.floor((Number(xp) || 0) / 1000) + 1);
}
function skillTemplate(name, xp = 0, level = 1) {
  return { name: String(name).trim(), xp: Math.max(0, Number(xp) || 0), level: Math.max(1, Math.floor(Number(level) || 1)) };
}
function safeUser(m) {
  if (!m) return null;
  const { passwordHash: _, password: __, ready: ___, ...x } = m;
  return {
    ...x,
    xp: Math.max(0, Number(x.xp) || 0),
    level: calcLevel(x.xp),
    ready: x.jobReadiness?.status === 'job_ready'
  };
}
function publicUser(m) {
  if (!m) return null;
  return {
    id: m.id,
    name: m.name,
    city: m.city || '',
    primarySkill: m.primarySkill || '',
    skills: Array.isArray(m.skills) ? m.skills.map(s => skillTemplate(s.name, s.xp, s.level)) : [],
    xp: Math.max(0, Number(m.xp) || 0),
    level: calcLevel(m.xp),
    ready: m.jobReadiness?.status === 'job_ready',
    jobReadiness: m.jobReadiness?.status || 'not_ready',
    profileComplete: m.profileComplete !== false,
    createdAt: m.createdAt || null
  };
}
function tokenFor(m) {
  return jwt.sign({ sub: m.id, role: m.role }, JWT_SECRET, {
    expiresIn: '7d',
    issuer: 'growland',
    audience: 'growland-web'
  });
}
function cookieValue(req, name) {
  const raw = String(req.headers.cookie || '');
  const match = raw.match(new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}
function setAuthCookie(res, token) {
  const parts = [
    `growland_session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${7 * 24 * 60 * 60}`
  ];
  if (isProduction) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
function clearAuthCookie(res) {
  const parts = ['growland_session=', 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isProduction) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const raw = header.startsWith('Bearer ') ? header.slice(7).trim() : cookieValue(req, 'growland_session');
    if (!raw) throw new Error('missing token');
    const decoded = jwt.verify(raw, JWT_SECRET, { issuer: 'growland', audience: 'growland-web' });
    req.auth = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'نیاز به ورود دارید.' });
  }
}
function admin(req, res, next) {
  if (req.auth?.role !== 'admin') return res.status(403).json({ message: 'دسترسی ادمین لازم است.' });
  next();
}
function rootAdmin(req, res, next) {
  if (req.auth?.sub !== 'admin-root') return res.status(403).json({ message: 'فقط ادمین اصلی می‌تواند مدیران را مدیریت کند.' });
  next();
}
function memberFromDB(db, id) {
  return (db.members || []).find(x => x.id === id);
}
function requireMember(req, res, db) {
  if (req.auth?.sub === 'admin-root') return null;
  const member = memberFromDB(db, req.auth?.sub);
  if (!member) {
    res.status(404).json({ message: 'عضو یافت نشد.' });
    return undefined;
  }
  return member;
}
function addXP(member, amount, reason, metadata = {}) {
  const delta = Math.max(0, Math.floor(Number(amount) || 0));
  if (!delta) return;
  member.xp = Math.max(0, Number(member.xp) || 0) + delta;
  member.level = calcLevel(member.xp);
  member.xpTransactions = Array.isArray(member.xpTransactions) ? member.xpTransactions : [];
  member.xpTransactions.unshift({
    id: randomUUID(),
    amount: delta,
    reason,
    metadata,
    createdAt: new Date().toISOString()
  });
  member.xpTransactions = member.xpTransactions.slice(0, 500);
}
function addSkillXP(member, skillName, amount) {
  const delta = Math.max(0, Math.floor(Number(amount) || 0));
  if (!delta || !skillName) return;
  member.skills = Array.isArray(member.skills) ? member.skills : [];
  let skill = member.skills.find(s => String(s.name).trim() === String(skillName).trim());
  if (!skill) {
    skill = skillTemplate(skillName);
    member.skills.push(skill);
  }
  skill.xp = Math.max(0, Number(skill.xp) || 0) + delta;
  skill.level = Math.min(5, Math.floor(skill.xp / 250) + 1);
}

function rootAdminName(db) {
  return String(db?.site?.admin?.name || DEFAULT_ADMIN_NAME).trim().slice(0, 80) || DEFAULT_ADMIN_NAME;
}

function setRootAdminName(db, name) {
  db.site = db.site && typeof db.site === 'object' ? db.site : {};
  db.site.admin = db.site.admin && typeof db.site.admin === 'object' ? db.site.admin : {};
  db.site.admin.name = String(name).trim().slice(0, 80) || DEFAULT_ADMIN_NAME;
  return db.site.admin.name;
}

function ensureDomain(db) {
  db.members = Array.isArray(db.members) ? db.members : [];
  db.reports = Array.isArray(db.reports) ? db.reports : [];
  db.announcements = Array.isArray(db.announcements) ? db.announcements : [];
  db.activities = Array.isArray(db.activities) ? db.activities : [];
  db.submissions = Array.isArray(db.submissions) ? db.submissions : [];
  db.assessments = Array.isArray(db.assessments) ? db.assessments : [];
  db.jobs = Array.isArray(db.jobs) ? db.jobs : [];
  db.auditLog = Array.isArray(db.auditLog) ? db.auditLog : [];
  for (const m of db.members) {
    m.xp = Math.max(0, Number(m.xp) || 0);
    m.level = calcLevel(m.xp);
    m.xpTransactions = Array.isArray(m.xpTransactions) ? m.xpTransactions : [];
    m.jobReadiness = m.jobReadiness && typeof m.jobReadiness === 'object'
      ? m.jobReadiness
      : { status: 'not_ready', assessmentId: null, updatedAt: null };
  }
  return db;
}
async function loadDB() {
  return ensureDomain(await readDB({ fresh: true }));
}
async function saveDB(db) {
  return writeDB(ensureDomain(db));
}
function storageFailure(res, err, message) {
  console.error('STORAGE_FAILURE', err);
  return res.status(503).json({
    message,
    code: 'STORAGE_UNAVAILABLE'
  });
}
function audit(db, actorId, action, targetId, metadata = {}) {
  db.auditLog.unshift({ id: randomUUID(), actorId, action, targetId, metadata, createdAt: new Date().toISOString() });
  db.auditLog = db.auditLog.slice(0, 2000);
}

app.get('/api/health', async (req, res) => {
  try {
    const db = await loadDB();
    res.json({
      ok: true,
      storage: process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'local',
      blobPath: process.env.BLOB_READ_WRITE_TOKEN ? (process.env.BLOB_DB_PATH || 'growland/v7/db.json.enc') : null,
      members: db.members.length
    });
  } catch (err) {
    console.error('HEALTH_STORAGE_ERROR', err);
    res.status(503).json({ ok: false, storage: 'unavailable', code: 'STORAGE_UNAVAILABLE' });
  }
});

app.get('/api/public/announcements', async (req, res) => {
  try {
    const db = await loadDB();
    res.json({ announcements: db.announcements || [] });
  } catch (err) {
    return storageFailure(res, err, 'ذخیره‌سازی GrowLand در دسترس نیست. تنظیمات Blob را بررسی کنید.');
  }
});
app.get('/api/public/members', async (req, res) => {
  try {
    const db = await loadDB();
    const members = db.members
      .filter(m => m.profileComplete !== false)
      .sort((a, b) => calcLevel(b.xp) - calcLevel(a.xp) || Number(b.xp) - Number(a.xp));
    res.json({ members: members.map(publicUser) });
  } catch (err) {
    return storageFailure(res, err, 'ذخیره‌سازی GrowLand در دسترس نیست. تنظیمات Blob را بررسی کنید.');
  }
});

app.post('/api/auth/register', rateLimit({ windowMs: 60_000, max: 10 }), async (req, res) => {
  try {
    const body = req.body || {};
    const phone = normalizePhone(body.phone);
    const password = String(body.password || '');
    if (!isValidPhone(phone)) return res.status(400).json({ message: 'شماره موبایل ایران را با فرمت +989xxxxxxxxx وارد کن.' });
    if (!validatePassword(password)) return res.status(400).json({ message: 'رمز عبور باید بین ۸ تا ۱۲۸ کاراکتر باشد.' });
    const name = String(body.name || '').trim();
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'نام باید بین ۲ تا ۸۰ کاراکتر باشد.' });
    if (!body.focus || !body.goal) return res.status(400).json({ message: 'نام، حوزه و هدف الزامی است.' });
    const age = body.age === '' || body.age == null ? null : Number(body.age);
    if (age !== null && (!Number.isInteger(age) || age < 5 || age > 120)) return res.status(400).json({ message: 'سن واردشده معتبر نیست.' });

    if (ADMIN_PHONE && phone === ADMIN_PHONE) return res.status(409).json({ message: 'این شماره برای مدیر اصلی رزرو شده است.' });

    const db = await loadDB();
    if (db.members.some(m => m.phone === phone)) return res.status(409).json({ message: 'این شماره قبلاً ثبت‌نام کرده است. وارد شوید.' });

    const member = {
      id: randomUUID(), name, age, phone, city: String(body.city || '').trim(),
      primarySkill: String(body.focus).trim(),
      skills: [skillTemplate(body.focus)],
      focusLevel: String(body.level || 'تازه شروع کردم'),
      goal: String(body.goal).trim(),
      hours: String(body.hours || '').trim(),
      future: String(body.future || '').trim(),
      why: String(body.why || '').trim(),
      about: String(body.about || '').trim(),
      xp: 0, level: 1, xpTransactions: [],
      jobReadiness: { status: 'not_ready', assessmentId: null, updatedAt: null },
      role: 'member', profileComplete: true,
      roadmap: 'ابتدا روی مهارت اصلی خود تمرکز کن، هر هفته یک خروجی قابل بررسی بساز و گزارش پیشرفتت را ارسال کن.',
      growth: [...Array(7)].map((_, i) => ({ label: `روز ${i + 1}`, xp: 0 })),
      passwordHash: passwordHash(password),
      createdAt: new Date().toISOString()
    };
    db.members.push(member);
    audit(db, member.id, 'member.registered', member.id);
    await saveDB(db);

    const token = tokenFor(member);
    setAuthCookie(res, token);
    res.status(201).json({ user: safeUser(member) });
  } catch (err) {
    return storageFailure(res, err, 'ثبت‌نام انجام نشد؛ ذخیره‌سازی GrowLand در دسترس نیست.');
  }
});

app.post('/api/auth/login', rateLimit({ windowMs: 60_000, max: 10 }), async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
  const password = String(req.body?.password || '');
  if (!isValidPhone(phone)) return res.status(400).json({ message: 'شماره موبایل معتبر نیست.' });

  if (ADMIN_PHONE && phone === ADMIN_PHONE) {
    if (!verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'شماره موبایل یا رمز عبور نادرست است.' });
    }
    const db = await loadDB();
    const adminUser = { id: 'admin-root', name: rootAdminName(db), phone, role: 'admin', xp: 0, level: 1, skills: [], profileComplete: true, ready: true };
    setAuthCookie(res, tokenFor(adminUser));
    return res.json({ user: adminUser });
  }

  const db = await loadDB();
  const member = db.members.find(m => m.phone === phone);
  if (!member) return res.status(401).json({ message: 'شماره موبایل یا رمز عبور نادرست است.' });

  const valid = Boolean(member.passwordHash) && verifyPassword(password, member.passwordHash);
  if (!valid) return res.status(401).json({ message: 'شماره موبایل یا رمز عبور نادرست است.' });

  setAuthCookie(res, tokenFor(member));
    res.json({ user: safeUser(member) });
  } catch (err) {
    return storageFailure(res, err, 'ورود انجام نشد؛ ذخیره‌سازی GrowLand در دسترس نیست.');
  }
});

app.post('/api/auth/password', auth, async (req, res) => {
  try {
    if (req.auth?.sub === 'admin-root') return res.status(403).json({ message: 'رمز مدیر اصلی از Environment Variables مدیریت می‌شود.' });
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!validatePassword(newPassword)) return res.status(400).json({ message: 'رمز جدید باید بین ۸ تا ۱۲۸ کاراکتر باشد.' });
    const db = await loadDB();
    const member = memberFromDB(db, req.auth.sub);
    if (!member) return res.status(404).json({ message: 'کاربر یافت نشد.' });
    if (!member.passwordHash || !verifyPassword(currentPassword, member.passwordHash)) {
      return res.status(401).json({ message: 'رمز فعلی نادرست است.' });
    }
    member.passwordHash = passwordHash(newPassword);
    audit(db, member.id, 'auth.password-changed', member.id);
    await saveDB(db);
    clearAuthCookie(res);
    res.json({ ok: true, message: 'رمز عبور تغییر کرد. دوباره وارد شوید.' });
  } catch (err) {
    return storageFailure(res, err, 'تغییر رمز انجام نشد؛ ذخیره‌سازی GrowLand در دسترس نیست.');
  }
});

app.post('/api/auth/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    if (req.auth?.sub === 'admin-root') {
      const db = await loadDB();
      return res.json({ user: { id: 'admin-root', name: rootAdminName(db), phone: ADMIN_PHONE, role: 'admin', xp: 0, level: 1, skills: [], profileComplete: true, ready: true } });
    }
    const db = await loadDB();
    const m = memberFromDB(db, req.auth.sub);
    if (!m) return res.status(401).json({ message: 'کاربر یافت نشد.' });
    res.json({ user: safeUser(m) });
  } catch (err) {
    return storageFailure(res, err, 'ذخیره‌سازی GrowLand در دسترس نیست.');
  }
});

app.get('/api/member/dashboard', auth, async (req, res) => {
  if (req.auth?.sub === 'admin-root') {
    try {
      const db = await loadDB();
      return res.json({
        member: { id: 'admin-root', name: rootAdminName(db), phone: ADMIN_PHONE, role: 'admin', xp: 0, level: 1, skills: [skillTemplate('مدیریت GrowLand')], ready: true, jobReadiness: { status: 'job_ready' }, roadmap: 'پنل رشد مدیر اصلی' },
        reports: [], growth: [...Array(7)].map((_, i) => ({ label: `روز ${i + 1}`, xp: 0 })), activities: [], submissions: []
      });
    } catch (err) {
      return storageFailure(res, err, 'ذخیره‌سازی GrowLand در دسترس نیست.');
    }
  }
  try {
    const db = await loadDB();
    const m = memberFromDB(db, req.auth.sub);
    if (!m) return res.status(404).json({ message: 'کاربر یافت نشد.' });
    const reports = db.reports.filter(r => r.memberId === m.id);
    const submissions = db.submissions.filter(s => s.memberId === m.id);
    const activities = db.activities.filter(a => a.active !== false);
    res.json({ member: safeUser(m), reports, growth: m.growth || [], activities, submissions });
  } catch (err) {
    return storageFailure(res, err, 'ذخیره‌سازی GrowLand در دسترس نیست.');
  }
});

app.patch('/api/admin/profile', auth, admin, rootAdmin, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'نام باید بین ۲ تا ۸۰ کاراکتر باشد.' });
    const db = await loadDB();
    const savedName = setRootAdminName(db, name);
    audit(db, req.auth.sub, 'admin.profile-updated', 'admin-root', { field: 'name' });
    await saveDB(db);
    res.json({ user: { id: 'admin-root', name: savedName, phone: ADMIN_PHONE, role: 'admin', xp: 0, level: 1, skills: [], profileComplete: true, ready: true } });
  } catch (e) {
    return storageFailure(res, e, 'تغییر نام مدیر اصلی انجام نشد.');
  }
});

app.put('/api/member/profile', auth, async (req, res) => {
  try {
    const db = await loadDB();
    const m = requireMember(req, res, db);
    if (!m) return res.status(403).json({ message: 'این عملیات برای مدیر اصلی مجاز نیست.' });
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'نام باید بین ۲ تا ۸۰ کاراکتر باشد.' });
      m.name = name;
    }
    if (req.body.phone !== undefined && req.body.phone !== m.phone) {
      const phone = normalizePhone(req.body.phone);
      if (!isValidPhone(phone)) return res.status(400).json({ message: 'شماره موبایل واردشده معتبر نیست.' });
      if (phone === ADMIN_PHONE) return res.status(403).json({ message: 'این شماره برای مدیر اصلی رزرو شده است.' });
      if (db.members.some(x => x.id !== m.id && x.phone === phone)) return res.status(409).json({ message: 'این شماره قبلاً استفاده شده است.' });
      m.phone = phone;
    }
    for (const key of ['city', 'goal', 'about', 'future', 'why', 'hours', 'focusLevel']) {
      if (req.body[key] !== undefined) m[key] = String(req.body[key]).trim().slice(0, 2000);
    }
    if (req.body.age !== undefined) {
      const age = Number(req.body.age);
      if (req.body.age !== '' && (!Number.isInteger(age) || age < 5 || age > 120)) return res.status(400).json({ message: 'سن واردشده معتبر نیست.' });
      m.age = req.body.age === '' ? null : age;
    }
    // Skills are controlled domain data; members may not assign arbitrary XP/level.
    if (Array.isArray(req.body.skills)) {
      m.skills = req.body.skills.slice(0, 20).map(s => skillTemplate(s.name)).filter(s => s.name.length > 0);
    }
    await saveDB(db);
    res.json({ user: safeUser(m) });
  } catch (e) {
    console.error('PROFILE_ERROR', e);
    res.status(500).json({ message: 'خطا در ذخیره پروفایل.' });
  }
});

app.post('/api/member/reports', auth, async (req, res) => {
  try {
    const db = await loadDB();
    const m = requireMember(req, res, db);
    if (!m) return res.status(403).json({ message: 'ارسال گزارش برای مدیر اصلی فعال نیست.' });
    const body = String(req.body?.body || '').trim();
    if (!body || body.length > 5000) return res.status(400).json({ message: 'متن گزارش باید بین ۱ تا ۵۰۰۰ کاراکتر باشد.' });
    db.reports.unshift({ id: randomUUID(), memberId: m.id, memberName: m.name, body, createdAt: new Date().toISOString() });
    await saveDB(db);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('REPORT_ERROR', e);
    res.status(500).json({ message: 'خطا در ارسال گزارش.' });
  }
});

app.delete('/api/admin/reports/:id', auth, admin, async (req, res) => {
  try {
    const db = await loadDB();
    const index = db.reports.findIndex(r => r.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'گزارش پیدا نشد.' });
    const [report] = db.reports.splice(index, 1);
    audit(db, req.auth.sub, 'report.deleted', report.id, { memberId: report.memberId || null });
    await saveDB(db);
    res.json({ ok: true });
  } catch (err) {
    return storageFailure(res, err, 'حذف گزارش انجام نشد.');
  }
});

app.get('/api/member/activities', auth, async (req, res) => {
  const db = await loadDB();
  const m = requireMember(req, res, db);
  if (!m) return res.status(403).json({ message: 'مدیر اصلی فعالیت عضو ندارد.' });
  res.json({ activities: db.activities.filter(a => a.active !== false), submissions: db.submissions.filter(s => s.memberId === m.id) });
});

app.post('/api/member/activities/:id/submissions', auth, async (req, res) => {
  try {
    const db = await loadDB();
    const m = requireMember(req, res, db);
    if (!m) return res.status(403).json({ message: 'ارسال فعالیت برای مدیر اصلی فعال نیست.' });
    const activity = db.activities.find(a => a.id === req.params.id && a.active !== false);
    if (!activity) return res.status(404).json({ message: 'فعالیت پیدا نشد.' });
    const existing = db.submissions.find(s => s.activityId === activity.id && s.memberId === m.id && s.status !== 'rejected');
    if (existing) return res.status(409).json({ message: 'برای این فعالیت قبلاً یک خروجی ثبت شده است.' });
    const artifact = String(req.body?.artifact || '').trim();
    if (!artifact || artifact.length > 10000) return res.status(400).json({ message: 'شواهد یا خروجی باید بین ۱ تا ۱۰۰۰۰ کاراکتر باشد.' });
    const submission = {
      id: randomUUID(), activityId: activity.id, memberId: m.id, artifact,
      status: 'pending', xpAwarded: 0, reviewerId: null, reviewNote: '',
      createdAt: new Date().toISOString(), reviewedAt: null
    };
    db.submissions.unshift(submission);
    await saveDB(db);
    res.status(201).json({ submission });
  } catch (e) {
    console.error('SUBMISSION_ERROR', e);
    res.status(500).json({ message: 'خطا در ثبت خروجی.' });
  }
});

app.get('/api/member/assessments', auth, async (req, res) => {
  const db = await loadDB();
  const m = requireMember(req, res, db);
  if (!m) return res.status(403).json({ message: 'مدیر اصلی ارزیابی عضو ندارد.' });
  res.json({ assessments: db.assessments.filter(a => a.memberId === m.id || a.public === true) });
});

// Job readiness is assessment-derived and read-only for members.
app.patch('/api/member/ready', auth, (req, res) => {
  res.status(409).json({ message: 'وضعیت آمادگی شغلی فقط پس از ارزیابی معتبر تغییر می‌کند.' });
});

app.get('/api/admin/overview', auth, admin, async (req, res) => {
  try {
    const db = await loadDB();
    const members = [...db.members].sort((a, b) => calcLevel(b.xp) - calcLevel(a.xp) || Number(b.xp) - Number(a.xp));
    const reports = [...db.reports].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const pendingSubmissions = db.submissions.filter(s => s.status === 'pending');
    res.json({ members: members.map(safeUser), reports, pendingSubmissions, activities: db.activities, assessments: db.assessments, auditLog: db.auditLog.slice(0, 100) });
  } catch (err) {
    console.error('ADMIN_OVERVIEW_ERROR', err);
    res.status(500).json({ message: 'خطا در خواندن اطلاعات پنل ادمین.', code: 'STORAGE_READ_FAILED' });
  }
});

app.post('/api/admin/activities', auth, admin, async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
  const skill = String(req.body?.skill || '').trim();
  const difficulty = String(req.body?.difficulty || 'simple').trim();
  const xp = Math.max(1, Math.min(1000, Math.floor(Number(req.body?.xp) || 100)));
  if (title.length < 3 || title.length > 160 || skill.length < 2 || skill.length > 100) return res.status(400).json({ message: 'عنوان و مهارت فعالیت معتبر نیستند.' });
  if (!['simple', 'medium', 'hard'].includes(difficulty)) return res.status(400).json({ message: 'سطح دشواری نامعتبر است.' });
  const db = await loadDB();
  const activity = { id: randomUUID(), title, skill, difficulty, xp, description: String(req.body?.description || '').trim().slice(0, 3000), active: true, createdAt: new Date().toISOString(), createdBy: req.auth.sub };
  db.activities.unshift(activity);
  audit(db, req.auth.sub, 'activity.created', activity.id);
  await saveDB(db);
    res.status(201).json({ activity });
  } catch (err) {
    return storageFailure(res, err, 'ذخیره فعالیت انجام نشد.');
  }
});

app.patch('/api/admin/submissions/:id', auth, admin, async (req, res) => {
  const db = await loadDB();
  const submission = db.submissions.find(s => s.id === req.params.id);
  if (!submission) return res.status(404).json({ message: 'خروجی پیدا نشد.' });
  if (submission.status !== 'pending') return res.status(409).json({ message: 'این خروجی قبلاً بررسی شده است.' });
  const activity = db.activities.find(a => a.id === submission.activityId);
  const member = db.members.find(m => m.id === submission.memberId);
  if (!activity || !member) return res.status(409).json({ message: 'داده فعالیت یا عضو ناقص است.' });
  const decision = req.body?.status;
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ message: 'وضعیت بررسی نامعتبر است.' });
  submission.status = decision;
  submission.reviewerId = req.auth.sub;
  submission.reviewNote = String(req.body?.note || '').trim().slice(0, 2000);
  submission.reviewedAt = new Date().toISOString();
  if (decision === 'approved') {
    submission.xpAwarded = activity.xp;
    addXP(member, activity.xp, 'activity.approved', { activityId: activity.id, submissionId: submission.id });
    addSkillXP(member, activity.skill, activity.xp);
    member.growth = Array.isArray(member.growth) ? member.growth : [];
    member.growth.push({ label: new Date().toLocaleDateString('fa-IR'), xp: member.xp });
    member.growth = member.growth.slice(-7);
  }
  audit(db, req.auth.sub, `submission.${decision}`, submission.id, { memberId: member.id, xp: submission.xpAwarded });
  await saveDB(db);
  res.json({ submission, member: safeUser(member) });
});

app.post('/api/admin/assessments', auth, admin, async (req, res) => {
  const memberId = String(req.body?.memberId || '');
  const status = String(req.body?.status || '');
  if (!memberId || !['not_ready', 'developing', 'job_ready'].includes(status)) return res.status(400).json({ message: 'عضو و وضعیت ارزیابی معتبر الزامی است.' });
  const db = await loadDB();
  const member = memberFromDB(db, memberId);
  if (!member) return res.status(404).json({ message: 'عضو یافت نشد.' });
  const assessment = {
    id: randomUUID(), memberId, status, score: Math.max(0, Math.min(100, Number(req.body?.score) || 0)),
    role: String(req.body?.role || '').trim().slice(0, 200),
    notes: String(req.body?.notes || '').trim().slice(0, 3000),
    reviewerId: req.auth.sub, createdAt: new Date().toISOString(), public: false
  };
  db.assessments.unshift(assessment);
  member.jobReadiness = { status, assessmentId: assessment.id, updatedAt: assessment.createdAt };
  audit(db, req.auth.sub, 'assessment.created', assessment.id, { memberId, status });
  await saveDB(db);
  res.status(201).json({ assessment, member: safeUser(member) });
});

app.patch('/api/admin/members/:id', auth, admin, async (req, res) => {
  const db = await loadDB();
  const m = memberFromDB(db, req.params.id);
  if (!m) return res.status(404).json({ message: 'عضو یافت نشد.' });
  if (req.body.xp !== undefined) {
    const desired = Math.max(0, Math.floor(Number(req.body.xp) || 0));
    const delta = desired - m.xp;
    if (delta > 0) addXP(m, delta, 'admin.adjustment', { target: desired });
    if (delta < 0) {
      m.xp = desired;
      m.level = calcLevel(desired);
      m.xpTransactions = Array.isArray(m.xpTransactions) ? m.xpTransactions : [];
      m.xpTransactions.unshift({ id: randomUUID(), amount: delta, reason: 'admin.correction', metadata: { target: desired }, createdAt: new Date().toISOString() });
    }
  }
  // Level is derived from XP; direct level mutation is intentionally ignored.
  if (req.body.roadmap !== undefined) m.roadmap = String(req.body.roadmap).trim().slice(0, 5000);
  if (Array.isArray(m.growth)) { m.growth.push({ label: new Date().toLocaleDateString('fa-IR'), xp: m.xp }); m.growth = m.growth.slice(-7); }
  audit(db, req.auth.sub, 'member.updated', m.id);
  await saveDB(db);
  res.json({ member: safeUser(m) });
});

app.post('/api/admin/members/:id/skills', auth, admin, async (req, res) => {
  const db = await loadDB();
  const m = memberFromDB(db, req.params.id);
  if (!m) return res.status(404).json({ message: 'عضو یافت نشد.' });
  const name = String(req.body?.name || '').trim();
  if (!name || name.length > 100) return res.status(400).json({ message: 'نام مهارت معتبر نیست.' });
  m.skills = Array.isArray(m.skills) ? m.skills : [];
  if (!m.skills.some(s => s.name === name)) m.skills.push(skillTemplate(name));
  audit(db, req.auth.sub, 'member.skill-added', m.id, { name });
  await saveDB(db);
  res.json({ member: safeUser(m) });
});

app.delete('/api/admin/members/:id', auth, admin, rootAdmin, async (req, res) => {
  const db = await loadDB();
  const m = memberFromDB(db, req.params.id);
  if (!m) return res.status(404).json({ message: 'عضو یافت نشد.' });
  if (m.phone === ADMIN_PHONE) return res.status(400).json({ message: 'ادمین اصلی قابل حذف نیست.' });
  db.members = db.members.filter(x => x.id !== req.params.id);
  db.reports = db.reports.filter(x => x.memberId !== req.params.id);
  db.submissions = db.submissions.filter(x => x.memberId !== req.params.id);
  db.assessments = db.assessments.filter(x => x.memberId !== req.params.id);
  audit(db, req.auth.sub, 'member.deleted', m.id);
  await saveDB(db);
  res.json({ ok: true });
});

app.delete('/api/admin/members/:id/skills', auth, admin, async (req, res) => {
  const db = await loadDB();
  const m = memberFromDB(db, req.params.id);
  if (!m) return res.status(404).json({ message: 'عضو یافت نشد.' });
  m.skills = (m.skills || []).filter(s => s.name !== req.body?.name);
  audit(db, req.auth.sub, 'member.skill-removed', m.id, { name: req.body?.name });
  await saveDB(db);
  res.json({ member: safeUser(m) });
});

app.patch('/api/admin/role', auth, admin, rootAdmin, async (req, res) => {
  const db = await loadDB();
  const phone = normalizePhone(req.body?.phone);
  const m = db.members.find(x => x.phone === phone);
  if (!m) return res.status(404).json({ message: 'عضو با این شماره پیدا نشد.' });
  m.role = 'admin';
  audit(db, req.auth.sub, 'member.promoted', m.id);
  await saveDB(db);
  res.json({ member: safeUser(m) });
});

app.patch('/api/admin/members/:id/role', auth, admin, rootAdmin, async (req, res) => {
  const db = await loadDB();
  const m = memberFromDB(db, req.params.id);
  if (!m) return res.status(404).json({ message: 'عضو یافت نشد.' });
  if (m.phone === ADMIN_PHONE) return res.status(400).json({ message: 'ادمین اصلی قابل عزل نیست.' });
  m.role = req.body?.role === 'admin' ? 'admin' : 'member';
  audit(db, req.auth.sub, `member.role.${m.role}`, m.id);
  await saveDB(db);
  res.json({ member: safeUser(m) });
});

app.use((err, req, res, next) => {
  console.error('API_ERROR', err);
  if (res.headersSent) return next(err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'بدنه درخواست JSON معتبر نیست.', code: 'INVALID_JSON' });
  }
  const message = String(err?.message || '');
  if (message.startsWith('GrowLand Blob') || message.startsWith('Local seed database')) {
    return res.status(503).json({ message: 'ذخیره‌سازی GrowLand در دسترس نیست. تنظیمات Blob را بررسی کنید.', code: 'STORAGE_UNAVAILABLE' });
  }
  res.status(500).json({ message: 'خطای داخلی سرور.', code: 'INTERNAL_SERVER_ERROR' });
});

if (!isProduction) app.listen(PORT, () => console.log(`GrowLand API running on http://localhost:${PORT}`));
export default app;
