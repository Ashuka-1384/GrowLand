import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { readDB, mutateDB } from './store.js';

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

function toLatinDigits(v = '') {
  return String(v)
    .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660));
}
function normalizePhone(v = '') {
  let s = toLatinDigits(v).trim().replace(/[\s()-]/g, '');
  if (s.startsWith('0098')) s = '+98' + s.slice(4);
  if (/^989\d{9}$/.test(s)) s = '+' + s;
  if (s.startsWith('09')) s = '+98' + s.slice(1);
  if (/^9\d{9}$/.test(s)) s = '+98' + s;
  return s;
}
function isValidPhone(v) { return /^\+989\d{9}$/.test(normalizePhone(v)); }

// Async scrypt: the synchronous variant blocked the whole event loop on every login/register.
const scryptAsync = (password, salt, length) => new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, length, { N: 16384, r: 8, p: 1 }, (error, key) => (error ? reject(error) : resolve(key)));
});
async function passwordHash(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `${salt.toString('base64')}.${hash.toString('base64')}`;
}
async function verifyPassword(password, stored) {
  try {
    const [salt64, hash64] = String(stored || '').split('.');
    if (!salt64 || !hash64) return false;
    const salt = Buffer.from(salt64, 'base64');
    const expected = Buffer.from(hash64, 'base64');
    const actual = await scryptAsync(password, salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
// Used for unknown phone numbers so "no such user" and "wrong password" take the same time.
let dummyHashPromise = null;
const dummyHash = () => (dummyHashPromise ||= passwordHash(crypto.randomBytes(12).toString('hex')));
async function verifyAdminPassword(password) {
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
  const { passwordHash: _, password: __, ready: ___, xpTransactions: ____, ...x } = m;
  return {
    ...x,
    xp: Math.max(0, Number(x.xp) || 0),
    level: calcLevel(x.xp),
    levelProgress: ((Math.max(0, Number(x.xp) || 0) % 1000) / 10),
    ready: x.jobReadiness?.status === 'job_ready'
  };
}
// What a PUBLIC visitor may see about a member. Phone, age and the private registration
// answers (why / future) are deliberately NOT included. Edit this list to change what the
// member-profile popup on the home page and /members can show.
function publicUser(m, proofs = 0) {
  if (!m) return null;
  return {
    id: m.id,
    name: m.name,
    city: m.city || '',
    primarySkill: m.primarySkill || '',
    skills: Array.isArray(m.skills) ? m.skills.map(s => skillTemplate(s.name, s.xp, s.level)) : [],
    xp: Math.max(0, Number(m.xp) || 0),
    level: calcLevel(m.xp),
    levelProgress: ((Math.max(0, Number(m.xp) || 0) % 1000) / 10),
    ready: m.jobReadiness?.status === 'job_ready',
    jobReadiness: m.jobReadiness?.status || 'not_ready',
    profileComplete: m.profileComplete !== false,
    focusLevel: m.focusLevel || '',
    goal: m.goal || '',
    about: String(m.about || '').trim().slice(0, 240),
    proofs,
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
class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
const isStorageError = err => err?.code === 'CONFLICT'
  || String(err?.message || '').startsWith('GrowLand Blob')
  || String(err?.message || '').startsWith('Local seed database');

// Wraps a route: HttpError -> proper status, storage problems -> 503, anything else -> 500.
const route = (fallback, fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (err) {
    if (res.headersSent) return;
    if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
    if (isStorageError(err)) return storageFailure(res, err, fallback);
    console.error('ROUTE_ERROR', req.method, req.path, err);
    return res.status(500).json({ message: fallback, code: 'INTERNAL_SERVER_ERROR' });
  }
};

function readAuth(req) {
  const header = req.headers.authorization || '';
  const raw = header.startsWith('Bearer ') ? header.slice(7).trim() : cookieValue(req, 'growland_session');
  if (!raw) return null;
  try { return jwt.verify(raw, JWT_SECRET, { issuer: 'growland', audience: 'growland-web' }); }
  catch { return null; }
}

// The role is ALWAYS resolved from the database, never trusted from the JWT.
// Previously a freshly promoted member kept a "member" token and every admin call
// answered "admin access required"; a demoted/deleted member kept working.
async function auth(req, res, next) {
  const decoded = readAuth(req);
  if (!decoded) return res.status(401).json({ message: 'نیاز به ورود دارید.' });
  try {
    const db = ensureDomain(await readDB());
    if (decoded.sub === 'admin-root') {
      req.auth = { sub: 'admin-root', role: 'admin' };
    } else {
      const member = memberFromDB(db, decoded.sub);
      if (!member) { clearAuthCookie(res); return res.status(401).json({ message: 'حساب کاربری شما دیگر فعال نیست.' }); }
      req.auth = { sub: member.id, role: member.role === 'admin' ? 'admin' : 'member' };
    }
    req.db = db;
    return next();
  } catch (err) {
    return storageFailure(res, err, 'ذخیره‌سازی GrowLand در دسترس نیست.');
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
  return (db.members || []).find(x => x.id === id && !x.deletedAt);
}
function mustMember(db, id) {
  if (id === 'admin-root') throw new HttpError(403, 'این عملیات برای مدیر اصلی مجاز نیست.');
  const m = memberFromDB(db, id);
  if (!m) throw new HttpError(404, 'عضو یافت نشد.');
  return m;
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
  db.notifications = Array.isArray(db.notifications) ? db.notifications : [];
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

const loadDB = async () => ensureDomain(await readDB());
// All writes go through here: fresh read -> change -> compare-and-swap write (retried on conflict).
const change = fn => mutateDB(db => fn(ensureDomain(db)));

function storageFailure(res, err, message) {
  console.error('STORAGE_FAILURE', err);
  return res.status(503).json({ message, code: 'STORAGE_UNAVAILABLE' });
}
function audit(db, actorId, action, targetId, metadata = {}) {
  db.auditLog.unshift({ id: randomUUID(), actorId, action, targetId, metadata, createdAt: new Date().toISOString() });
  db.auditLog = db.auditLog.slice(0, 2000);
}
function adminIds(db) {
  return ['admin-root', ...db.members.filter(m => m.role === 'admin' && !m.deletedAt).map(m => m.id)];
}
function notifyUsers(db, userIds, { type, title, body = '' }) {
  const now = new Date().toISOString();
  for (const userId of new Set(userIds.filter(Boolean))) {
    db.notifications.unshift({ id: randomUUID(), userId, type, title, body, read: false, createdAt: now });
  }
  db.notifications = db.notifications.slice(0, 1500);
}
const notifyAdmins = (db, payload, exceptId = null) => notifyUsers(db, adminIds(db).filter(id => id !== exceptId), payload);
const clip = (v, max) => String(v ?? '').trim().slice(0, max);
const rootUser = db => ({ id: 'admin-root', name: rootAdminName(db), phone: ADMIN_PHONE, role: 'admin', xp: 0, level: 1, skills: [], profileComplete: true, ready: true });
const STORAGE_MSG = 'ذخیره‌سازی GrowLand در دسترس نیست. تنظیمات Blob را بررسی کنید.';

app.get('/api/health', route(STORAGE_MSG, async (req, res) => {
  await loadDB(); // proves storage is reachable
  res.json({ ok: true });
}));

// Public, identical for every visitor: let the CDN absorb bursts for a few seconds instead of
// decrypting the whole database on every home-page view.
const publicCache = res => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=20, stale-while-revalidate=60');
  res.setHeader('Vary', 'Accept-Encoding');
};

app.get('/api/public/announcements', route(STORAGE_MSG, async (req, res) => {
  const db = await loadDB();
  publicCache(res);
  res.json({ announcements: db.announcements });
}));
app.get('/api/public/members', route(STORAGE_MSG, async (req, res) => {
  const db = await loadDB();
  const proofs = new Map();
  for (const s of db.submissions) if (s.status === 'approved') proofs.set(s.memberId, (proofs.get(s.memberId) || 0) + 1);
  const members = db.members
    .filter(m => m.profileComplete !== false && !m.deletedAt)
    .sort((a, b) => calcLevel(b.xp) - calcLevel(a.xp) || Number(b.xp) - Number(a.xp)
      || String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  publicCache(res);
  res.json({ members: members.map(m => publicUser(m, proofs.get(m.id) || 0)) });
}));

app.post('/api/auth/register', rateLimit({ windowMs: 60_000, max: 10 }), route('ثبت‌نام انجام نشد؛ ذخیره‌سازی GrowLand در دسترس نیست.', async (req, res) => {
  const body = req.body || {};
  const phone = normalizePhone(body.phone);
  const password = String(body.password || '');
  if (!isValidPhone(phone)) throw new HttpError(400, 'شماره موبایل ایران را با فرمت 09123456789 یا +989123456789 وارد کن.');
  if (!validatePassword(password)) throw new HttpError(400, 'رمز عبور باید بین ۸ تا ۱۲۸ کاراکتر باشد.');
  const name = clip(body.name, 200);
  if (name.length < 2 || name.length > 80) throw new HttpError(400, 'نام باید بین ۲ تا ۸۰ کاراکتر باشد.');
  const focus = clip(body.focus, 100);
  const goal = clip(body.goal, 300);
  if (!focus || !goal) throw new HttpError(400, 'حوزه تمرکز و هدف اصلی الزامی است.');
  const rawAge = toLatinDigits(body.age ?? '').trim();
  const age = rawAge === '' ? null : Number(rawAge);
  if (age !== null && (!Number.isInteger(age) || age < 5 || age > 120)) throw new HttpError(400, 'سن واردشده معتبر نیست.');
  if (ADMIN_PHONE && phone === ADMIN_PHONE) throw new HttpError(409, 'این شماره برای مدیر اصلی رزرو شده است.');
  const hash = await passwordHash(password);

  const member = await change(db => {
    if (db.members.some(m => m.phone === phone && !m.deletedAt)) throw new HttpError(409, 'این شماره قبلاً ثبت‌نام کرده است. وارد شوید.');
    const created = {
      id: randomUUID(), name, age, phone,
      city: clip(body.city, 100),
      primarySkill: focus,
      skills: [skillTemplate(focus)],
      focusLevel: clip(body.level, 100) || 'تازه شروع کردم',
      goal,
      hours: clip(body.hours, 100),
      future: clip(body.future, 2000),
      why: clip(body.why, 2000),
      about: clip(body.about, 2000),
      xp: 0, level: 1, xpTransactions: [],
      jobReadiness: { status: 'not_ready', assessmentId: null, updatedAt: null },
      role: 'member', profileComplete: true,
      roadmap: 'ابتدا روی مهارت اصلی خود تمرکز کن، هر هفته یک خروجی قابل بررسی بساز و گزارش پیشرفتت را ارسال کن.',
      growth: [...Array(7)].map((_, i) => ({ label: `روز ${i + 1}`, xp: 0 })),
      passwordHash: hash,
      createdAt: new Date().toISOString()
    };
    db.members.push(created);
    audit(db, created.id, 'member.registered', created.id);
    notifyAdmins(db, { type: 'member.registered', title: 'عضو جدید', body: `${created.name} (${created.phone}) در حوزه «${created.primarySkill}» ثبت‌نام کرد.` });
    notifyUsers(db, [created.id], { type: 'welcome', title: 'به GrowLand خوش آمدی', body: 'پروفایلت ساخته شد. از بخش فعالیت‌ها اولین خروجی‌ات را ثبت کن.' });
    return created;
  });
  setAuthCookie(res, tokenFor(member));
  res.status(201).json({ user: safeUser(member) });
}));

app.post('/api/auth/login', rateLimit({ windowMs: 60_000, max: 10 }), route('ورود انجام نشد؛ ذخیره‌سازی GrowLand در دسترس نیست.', async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const password = String(req.body?.password || '');
  if (!isValidPhone(phone)) throw new HttpError(400, 'شماره موبایل معتبر نیست.');
  const bad = () => new HttpError(401, 'شماره موبایل یا رمز عبور نادرست است.');
  const db = await loadDB();
  if (ADMIN_PHONE && phone === ADMIN_PHONE) {
    if (!(await verifyAdminPassword(password))) throw bad();
    const u = rootUser(db);
    setAuthCookie(res, tokenFor(u));
    return res.json({ user: u });
  }
  const member = db.members.find(m => m.phone === phone && !m.deletedAt);
  if (!(await verifyPassword(password, member?.passwordHash || await dummyHash())) || !member?.passwordHash) throw bad();
  setAuthCookie(res, tokenFor(member));
  res.json({ user: safeUser(member) });
}));

app.post('/api/auth/password', auth, route('تغییر رمز انجام نشد.', async (req, res) => {
  if (req.auth.sub === 'admin-root') throw new HttpError(403, 'رمز مدیر اصلی از Environment Variables مدیریت می‌شود.');
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  if (!validatePassword(newPassword)) throw new HttpError(400, 'رمز جدید باید بین ۸ تا ۱۲۸ کاراکتر باشد.');
  const hash = await passwordHash(newPassword);
  await change(async db => {
    const member = mustMember(db, req.auth.sub);
    if (!member.passwordHash || !(await verifyPassword(currentPassword, member.passwordHash))) throw new HttpError(400, 'رمز فعلی نادرست است.');
    member.passwordHash = hash;
    audit(db, member.id, 'auth.password-changed', member.id);
  });
  clearAuthCookie(res);
  res.json({ ok: true, message: 'رمز عبور تغییر کرد. دوباره وارد شوید.' });
}));

app.post('/api/auth/logout', (req, res) => { clearAuthCookie(res); res.json({ ok: true }); });

app.get('/api/auth/me', route(STORAGE_MSG, async (req, res) => {
  const decoded = readAuth(req);
  if (!decoded) return res.json({ user: null });
  const db = await loadDB();
  if (decoded.sub === 'admin-root') return res.json({ user: rootUser(db) });
  const m = memberFromDB(db, decoded.sub);
  if (!m) { clearAuthCookie(res); return res.json({ user: null }); }
  res.json({ user: safeUser(m) });
}));

// ---------- Notifications ----------
app.get('/api/notifications', auth, route(STORAGE_MSG, async (req, res) => {
  const mine = req.db.notifications.filter(n => n.userId === req.auth.sub);
  res.json({ notifications: mine.slice(0, 40), unread: mine.filter(n => !n.read).length });
}));
app.post('/api/notifications/read', auth, route('به‌روزرسانی اعلان‌ها انجام نشد.', async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : null;
  await change(db => {
    for (const n of db.notifications) {
      if (n.userId === req.auth.sub && (!ids || ids.includes(n.id))) n.read = true;
    }
  });
  res.json({ ok: true });
}));

// ---------- Member ----------
app.get('/api/member/dashboard', auth, route(STORAGE_MSG, async (req, res) => {
  const db = req.db;
  if (req.auth.sub === 'admin-root') {
    return res.json({
      member: { ...rootUser(db), skills: [skillTemplate('مدیریت GrowLand')], jobReadiness: { status: 'job_ready' }, roadmap: 'پنل رشد مدیر اصلی' },
      reports: [], growth: [...Array(7)].map((_, i) => ({ label: `روز ${i + 1}`, xp: 0 })), activities: [], submissions: []
    });
  }
  const m = mustMember(db, req.auth.sub);
  res.json({
    member: safeUser(m),
    reports: db.reports.filter(r => r.memberId === m.id),
    growth: m.growth || [],
    activities: db.activities.filter(a => a.active !== false),
    submissions: db.submissions.filter(s => s.memberId === m.id),
    assessments: db.assessments.filter(a => a.memberId === m.id).slice(0, 5)
  });
}));

app.patch('/api/admin/profile', auth, admin, rootAdmin, route('تغییر نام مدیر اصلی انجام نشد.', async (req, res) => {
  const name = clip(req.body?.name, 200);
  if (name.length < 2 || name.length > 80) throw new HttpError(400, 'نام باید بین ۲ تا ۸۰ کاراکتر باشد.');
  const user = await change(db => {
    setRootAdminName(db, name);
    audit(db, 'admin-root', 'admin.profile-updated', 'admin-root', { field: 'name' });
    return rootUser(db);
  });
  res.json({ user });
}));

app.put('/api/member/profile', auth, route('خطا در ذخیره پروفایل.', async (req, res) => {
  const b = req.body || {};
  const user = await change(db => {
    const m = mustMember(db, req.auth.sub);
    if (b.name !== undefined) {
      const name = clip(b.name, 200);
      if (name.length < 2 || name.length > 80) throw new HttpError(400, 'نام باید بین ۲ تا ۸۰ کاراکتر باشد.');
      m.name = name;
    }
    if (b.phone !== undefined && normalizePhone(b.phone) !== m.phone) {
      const phone = normalizePhone(b.phone);
      if (!isValidPhone(phone)) throw new HttpError(400, 'شماره موبایل واردشده معتبر نیست.');
      if (phone === ADMIN_PHONE) throw new HttpError(403, 'این شماره برای مدیر اصلی رزرو شده است.');
      if (db.members.some(x => x.id !== m.id && !x.deletedAt && x.phone === phone)) throw new HttpError(409, 'این شماره قبلاً استفاده شده است.');
      m.phone = phone;
    }
    for (const key of ['city', 'goal', 'about', 'future', 'why', 'hours', 'focusLevel']) {
      if (b[key] !== undefined) m[key] = clip(b[key], 2000);
    }
    if (b.focus !== undefined) {
      const focus = clip(b.focus, 100);
      if (focus) {
        m.primarySkill = focus;
        m.skills = Array.isArray(m.skills) ? m.skills : [];
        if (!m.skills.some(s => s.name === focus)) m.skills.unshift(skillTemplate(focus));
      }
    }
    if (b.age !== undefined) {
      const raw = toLatinDigits(b.age).trim();
      const age = raw === '' ? null : Number(raw);
      if (age !== null && (!Number.isInteger(age) || age < 5 || age > 120)) throw new HttpError(400, 'سن واردشده معتبر نیست.');
      m.age = age;
    }
    return safeUser(m);
  });
  res.json({ user });
}));

app.post('/api/member/reports', auth, route('خطا در ارسال گزارش.', async (req, res) => {
  const body = clip(req.body?.body, 6000);
  if (!body || body.length > 5000) throw new HttpError(400, 'متن گزارش باید بین ۱ تا ۵۰۰۰ کاراکتر باشد.');
  await change(db => {
    const m = mustMember(db, req.auth.sub);
    db.reports.unshift({ id: randomUUID(), memberId: m.id, memberName: m.name, body, createdAt: new Date().toISOString() });
    notifyAdmins(db, { type: 'report.created', title: 'گزارش جدید', body: `${m.name} یک گزارش پیشرفت ارسال کرد.` }, m.id);
  });
  res.status(201).json({ ok: true });
}));

app.delete('/api/admin/reports/:id', auth, admin, route('حذف گزارش انجام نشد.', async (req, res) => {
  await change(db => {
    const index = db.reports.findIndex(r => r.id === req.params.id);
    if (index === -1) throw new HttpError(404, 'گزارش پیدا نشد.');
    const [report] = db.reports.splice(index, 1);
    audit(db, req.auth.sub, 'report.deleted', report.id, { memberId: report.memberId || null });
  });
  res.json({ ok: true });
}));

app.get('/api/member/activities', auth, route(STORAGE_MSG, async (req, res) => {
  const m = mustMember(req.db, req.auth.sub);
  res.json({ activities: req.db.activities.filter(a => a.active !== false), submissions: req.db.submissions.filter(s => s.memberId === m.id) });
}));

app.post('/api/member/activities/:id/submissions', auth, route('خطا در ثبت خروجی.', async (req, res) => {
  const artifact = clip(req.body?.artifact, 10001);
  if (!artifact || artifact.length > 10000) throw new HttpError(400, 'شواهد یا خروجی باید بین ۱ تا ۱۰۰۰۰ کاراکتر باشد.');
  const submission = await change(db => {
    const m = mustMember(db, req.auth.sub);
    const activity = db.activities.find(a => a.id === req.params.id && a.active !== false);
    if (!activity) throw new HttpError(404, 'فعالیت پیدا نشد.');
    if (db.submissions.some(s => s.activityId === activity.id && s.memberId === m.id && s.status !== 'rejected')) {
      throw new HttpError(409, 'برای این فعالیت قبلاً یک خروجی ثبت شده است.');
    }
    const created = {
      id: randomUUID(), activityId: activity.id, memberId: m.id, artifact,
      status: 'pending', xpAwarded: 0, reviewerId: null, reviewNote: '',
      createdAt: new Date().toISOString(), reviewedAt: null
    };
    db.submissions.unshift(created);
    notifyAdmins(db, { type: 'submission.created', title: 'خروجی جدید در انتظار بررسی', body: `${m.name} برای «${activity.title}» خروجی ثبت کرد.` }, m.id);
    return created;
  });
  res.status(201).json({ submission });
}));

app.get('/api/member/assessments', auth, route(STORAGE_MSG, async (req, res) => {
  const m = mustMember(req.db, req.auth.sub);
  res.json({ assessments: req.db.assessments.filter(a => a.memberId === m.id || a.public === true) });
}));

app.patch('/api/member/ready', auth, (req, res) => {
  res.status(409).json({ message: 'وضعیت آمادگی شغلی فقط پس از ارزیابی معتبر تغییر می‌کند.' });
});

// ---------- Admin ----------
app.get('/api/admin/overview', auth, admin, route('خطا در خواندن اطلاعات پنل ادمین.', async (req, res) => {
  const db = req.db;
  const live = db.members.filter(m => !m.deletedAt);
  const liveIds = new Set(live.map(m => m.id));
  const members = [...live].sort((a, b) => calcLevel(b.xp) - calcLevel(a.xp) || Number(b.xp) - Number(a.xp));
  const reports = db.reports.filter(r => liveIds.has(r.memberId)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const pendingSubmissions = db.submissions.filter(s => s.status === 'pending' && liveIds.has(s.memberId));
  res.json({
    members: members.map(safeUser), reports, pendingSubmissions,
    activities: db.activities, assessments: db.assessments.filter(a => liveIds.has(a.memberId)),
    auditLog: db.auditLog.slice(0, 100)
  });
}));

app.post('/api/admin/activities', auth, admin, route('ذخیره فعالیت انجام نشد.', async (req, res) => {
  const title = clip(req.body?.title, 200);
  const skill = clip(req.body?.skill, 200);
  const difficulty = clip(req.body?.difficulty || 'simple', 20);
  const xp = Math.max(1, Math.min(1000, Math.floor(Number(toLatinDigits(req.body?.xp)) || 100)));
  if (title.length < 3 || title.length > 160 || skill.length < 2 || skill.length > 100) throw new HttpError(400, 'عنوان و مهارت فعالیت معتبر نیستند.');
  if (!['simple', 'medium', 'hard'].includes(difficulty)) throw new HttpError(400, 'سطح دشواری نامعتبر است.');
  const activity = await change(db => {
    const created = { id: randomUUID(), title, skill, difficulty, xp, description: clip(req.body?.description, 3000), active: true, createdAt: new Date().toISOString(), createdBy: req.auth.sub };
    db.activities.unshift(created);
    audit(db, req.auth.sub, 'activity.created', created.id);
    return created;
  });
  res.status(201).json({ activity });
}));

app.patch('/api/admin/submissions/:id', auth, admin, route('ثبت نتیجه بررسی انجام نشد.', async (req, res) => {
  const decision = req.body?.status;
  if (!['approved', 'rejected'].includes(decision)) throw new HttpError(400, 'وضعیت بررسی نامعتبر است.');
  const out = await change(db => {
    const submission = db.submissions.find(s => s.id === req.params.id);
    if (!submission) throw new HttpError(404, 'خروجی پیدا نشد.');
    if (submission.status !== 'pending') throw new HttpError(409, 'این خروجی قبلاً بررسی شده است.');
    const activity = db.activities.find(a => a.id === submission.activityId);
    const member = memberFromDB(db, submission.memberId);
    if (!activity || !member) throw new HttpError(409, 'داده فعالیت یا عضو ناقص است.');
    submission.status = decision;
    submission.reviewerId = req.auth.sub;
    submission.reviewNote = clip(req.body?.note, 2000);
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
    notifyUsers(db, [member.id], decision === 'approved'
      ? { type: 'submission.approved', title: 'خروجی تأیید شد', body: `«${activity.title}» تأیید شد و ${activity.xp} XP گرفتی.` }
      : { type: 'submission.rejected', title: 'خروجی رد شد', body: `«${activity.title}» نیاز به بازبینی دارد. می‌توانی دوباره ثبت کنی.` });
    return { submission, member: safeUser(member) };
  });
  res.json(out);
}));

app.post('/api/admin/assessments', auth, admin, route('ثبت ارزیابی انجام نشد.', async (req, res) => {
  const memberId = String(req.body?.memberId || '');
  const status = String(req.body?.status || '');
  if (!memberId || !['not_ready', 'developing', 'job_ready'].includes(status)) throw new HttpError(400, 'عضو و وضعیت ارزیابی معتبر الزامی است.');
  const out = await change(db => {
    const member = memberFromDB(db, memberId);
    if (!member) throw new HttpError(404, 'عضو یافت نشد.');
    const assessment = {
      id: randomUUID(), memberId, status, score: Math.max(0, Math.min(100, Number(toLatinDigits(req.body?.score)) || 0)),
      role: clip(req.body?.role, 200), notes: clip(req.body?.notes, 3000),
      reviewerId: req.auth.sub, createdAt: new Date().toISOString(), public: false
    };
    db.assessments.unshift(assessment);
    member.jobReadiness = { status, assessmentId: assessment.id, updatedAt: assessment.createdAt };
    audit(db, req.auth.sub, 'assessment.created', assessment.id, { memberId, status });
    const label = { not_ready: 'در مسیر رشد', developing: 'در حال توسعه', job_ready: 'آماده کار' }[status];
    notifyUsers(db, [memberId], { type: 'assessment.created', title: 'ارزیابی جدید ثبت شد', body: `وضعیت شغلی تو اکنون «${label}» است.` });
    return { assessment, member: safeUser(member) };
  });
  res.status(201).json(out);
}));

app.patch('/api/admin/members/:id', auth, admin, route('ذخیره تغییرات عضو انجام نشد.', async (req, res) => {
  const out = await change(db => {
    const m = mustMember(db, req.params.id);
    const before = m.xp;
    if (req.body?.xp !== undefined) {
      const desired = Math.max(0, Math.floor(Number(toLatinDigits(req.body.xp)) || 0));
      const delta = desired - m.xp;
      if (delta > 0) addXP(m, delta, 'admin.adjustment', { target: desired });
      if (delta < 0) {
        m.xp = desired;
        m.level = calcLevel(desired);
        m.xpTransactions = Array.isArray(m.xpTransactions) ? m.xpTransactions : [];
        m.xpTransactions.unshift({ id: randomUUID(), amount: delta, reason: 'admin.correction', metadata: { target: desired }, createdAt: new Date().toISOString() });
      }
    }
    if (req.body?.roadmap !== undefined) m.roadmap = clip(req.body.roadmap, 5000);
    if (m.xp !== before) {
      m.growth = Array.isArray(m.growth) ? m.growth : [];
      m.growth.push({ label: new Date().toLocaleDateString('fa-IR'), xp: m.xp });
      m.growth = m.growth.slice(-7);
    }
    audit(db, req.auth.sub, 'member.updated', m.id);
    return { member: safeUser(m) };
  });
  res.json(out);
}));

app.post('/api/admin/members/:id/skills', auth, admin, route('افزودن مهارت انجام نشد.', async (req, res) => {
  const name = clip(req.body?.name, 101);
  if (!name || name.length > 100) throw new HttpError(400, 'نام مهارت معتبر نیست.');
  const out = await change(db => {
    const m = mustMember(db, req.params.id);
    m.skills = Array.isArray(m.skills) ? m.skills : [];
    if (!m.skills.some(s => s.name === name)) m.skills.push(skillTemplate(name));
    audit(db, req.auth.sub, 'member.skill-added', m.id, { name });
    return { member: safeUser(m) };
  });
  res.json(out);
}));

app.delete('/api/admin/members/:id/skills', auth, admin, route('حذف مهارت انجام نشد.', async (req, res) => {
  const name = clip(req.body?.name, 100);
  const out = await change(db => {
    const m = mustMember(db, req.params.id);
    m.skills = (m.skills || []).filter(s => s.name !== name);
    audit(db, req.auth.sub, 'member.skill-removed', m.id, { name });
    return { member: safeUser(m) };
  });
  res.json(out);
}));

// Real removal: the member, their reports and submissions disappear from every list.
// The audit log keeps a minimal record (id + name + phone tail) for accountability.
app.delete('/api/admin/members/:id', auth, admin, rootAdmin, route('حذف عضو انجام نشد.', async (req, res) => {
  await change(db => {
    const idx = db.members.findIndex(m => m.id === req.params.id);
    if (idx === -1) throw new HttpError(404, 'عضو یافت نشد.');
    const m = db.members[idx];
    if (m.phone === ADMIN_PHONE) throw new HttpError(400, 'ادمین اصلی قابل حذف نیست.');
    db.members.splice(idx, 1);
    db.reports = db.reports.filter(r => r.memberId !== m.id);
    db.submissions = db.submissions.filter(s => s.memberId !== m.id);
    db.assessments = db.assessments.filter(a => a.memberId !== m.id);
    db.notifications = db.notifications.filter(n => n.userId !== m.id);
    audit(db, req.auth.sub, 'member.deleted', m.id, { name: m.name, phoneTail: String(m.phone).slice(-4) });
  });
  res.json({ ok: true });
}));

function setRole(db, actorId, m, role) {
  if (m.phone === ADMIN_PHONE) throw new HttpError(400, 'نقش ادمین اصلی قابل تغییر نیست.');
  if (m.role === role) throw new HttpError(409, role === 'admin' ? 'این عضو از قبل ادمین است.' : 'این عضو ادمین نیست.');
  m.role = role;
  audit(db, actorId, role === 'admin' ? 'member.promoted' : 'member.demoted', m.id);
  if (role === 'admin') {
    notifyUsers(db, [m.id], { type: 'role.promoted', title: 'دسترسی ادمین فعال شد', body: 'ادمین اصلی دسترسی مدیریت را برای تو فعال کرد. از منوی «مدیریت» وارد پنل شو.' });
  } else {
    notifyUsers(db, [m.id], { type: 'role.demoted', title: 'دسترسی ادمین برداشته شد', body: 'نقش تو به «عضو» تغییر کرد.' });
  }
  notifyUsers(db, [actorId], { type: 'role.changed', title: role === 'admin' ? 'ادمین جدید اضافه شد' : 'ادمین عزل شد', body: `${m.name} (${m.phone}) ${role === 'admin' ? 'اکنون ادمین است.' : 'دیگر ادمین نیست.'}` });
}

app.patch('/api/admin/role', auth, admin, rootAdmin, route('تغییر نقش انجام نشد.', async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  if (!isValidPhone(phone)) throw new HttpError(400, 'شماره موبایل معتبر نیست.');
  const out = await change(db => {
    const m = db.members.find(x => x.phone === phone && !x.deletedAt);
    if (!m) throw new HttpError(404, 'عضو با این شماره پیدا نشد.');
    setRole(db, req.auth.sub, m, 'admin');
    return { member: safeUser(m) };
  });
  res.json(out);
}));

app.patch('/api/admin/members/:id/role', auth, admin, rootAdmin, route('تغییر نقش انجام نشد.', async (req, res) => {
  const role = req.body?.role === 'admin' ? 'admin' : 'member';
  const out = await change(db => {
    const m = mustMember(db, req.params.id);
    setRole(db, req.auth.sub, m, role);
    return { member: safeUser(m) };
  });
  res.json(out);
}));

app.use('/api', (req, res) => res.status(404).json({ message: 'مسیر API پیدا نشد.' }));

app.use((err, req, res, next) => {
  console.error('API_ERROR', err);
  if (res.headersSent) return next(err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'بدنه درخواست JSON معتبر نیست.', code: 'INVALID_JSON' });
  }
  if (isStorageError(err)) return res.status(503).json({ message: STORAGE_MSG, code: 'STORAGE_UNAVAILABLE' });
  res.status(500).json({ message: 'خطای داخلی سرور.', code: 'INTERNAL_SERVER_ERROR' });
});

if (!isProduction) app.listen(PORT, () => console.log(`GrowLand API running on http://localhost:${PORT}`));
export default app;
