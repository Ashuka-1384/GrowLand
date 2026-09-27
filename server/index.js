import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { readDB, writeDB } from './store.js';

const app=express();
const PORT=process.env.PORT||3001;
const isProduction=process.env.NODE_ENV==='production';
const JWT_SECRET=process.env.JWT_SECRET || (isProduction ? '' : 'local-development-secret');
const ADMIN_PHONE=normalizePhone(process.env.ADMIN_PHONE||'');
function normalizeOrigin(value='') {
  try { return new URL(String(value).trim()).origin.replace(/\/$/, ''); }
  catch { return ''; }
}
const allowedOrigins=(process.env.CLIENT_URL||'').split(',').map(normalizeOrigin).filter(Boolean);
function requestHost(req) {
  return String(req.headers['x-forwarded-host'] || req.get('host') || '').split(',')[0].trim().toLowerCase();
}
function isSameOrigin(req, origin) {
  try {
    const u = new URL(origin);
    return u.host.toLowerCase() === requestHost(req) && (u.protocol === 'https:' || u.protocol === 'http:');
  } catch {
    return false;
  }
}

if(isProduction && !process.env.JWT_SECRET){
  throw new Error('JWT_SECRET must be configured in production.');
}
if(!ADMIN_PHONE){
  console.warn('WARNING: ADMIN_PHONE is not configured.');
}

app.set('trust proxy',1);

const requestHits=new Map();
function rateLimit({windowMs=60_000,max=120}={}){
  return (req,res,next)=>{
    const now=Date.now();
    const key=`${req.ip}:${req.path}`;
    const item=requestHits.get(key);
    if(!item || now-item.startedAt>windowMs){ requestHits.set(key,{startedAt:now,count:1}); return next(); }
    item.count+=1;
    if(item.count>max) return res.status(429).json({message:'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.'});
    return next();
  };
}

app.disable('x-powered-by');
app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  next();
});
app.use((req,res,next)=>{
  const origin=req.headers.origin;
  if(!origin || isSameOrigin(req,origin) || allowedOrigins.includes(normalizeOrigin(origin)) || (!isProduction && allowedOrigins.length===0)) return next();
  return next(new Error('Origin not allowed by CORS'));
});
app.use(cors({
  // The middleware immediately above has already enforced the allowlist/same-origin rule.
  // Here we only reflect the accepted origin so browsers receive the required CORS headers.
  origin:true,
  credentials:true
}));
app.use(express.json({limit:'1mb',strict:true}));
app.use('/api',rateLimit({windowMs:60_000,max:240}));
setInterval(()=>{const now=Date.now();for(const [key,item] of requestHits){if(now-item.startedAt>300_000)requestHits.delete(key)}},300_000).unref();

function normalizePhone(v=''){let s=String(v).trim().replace(/[\s()-]/g,'');if(s.startsWith('0098'))s='+98'+s.slice(4);if(s.startsWith('09'))s='+98'+s.slice(1);if(s.startsWith('9'))s='+98'+s;return s}
function isValidPhone(v){return /^\+989\d{9}$/.test(normalizePhone(v))}
function safeUser(m){if(!m)return null;const {password,...x}=m;return x}
function publicUser(m){if(!m)return null;return {id:m.id,name:m.name,city:m.city||'',primarySkill:m.primarySkill||'',skills:Array.isArray(m.skills)?m.skills.map(s=>({name:String(s.name||''),xp:Number(s.xp)||0,level:Number(s.level)||1})):[],xp:Number(m.xp)||0,level:Number(m.level)||1,ready:Boolean(m.ready),profileComplete:m.profileComplete!==false,createdAt:m.createdAt||null};}
function tokenFor(m){return jwt.sign({sub:m.id,role:m.role},JWT_SECRET,{expiresIn:'30d',issuer:'growland',audience:'growland-web'})}
function auth(req,res,next){try{const authHeader=req.headers.authorization||'';const raw=authHeader.startsWith('Bearer ')?authHeader.slice(7).trim():req.cookies?.token;if(!raw) throw new Error('missing token');const decoded=jwt.verify(raw,JWT_SECRET,{issuer:'growland',audience:'growland-web'});req.auth=decoded;next()}catch{res.status(401).json({message:'نیاز به ورود دارید.'})}}
function admin(req,res,next){if(req.auth?.role!=='admin')return res.status(403).json({message:'دسترسی ادمین لازم است.'});next()}
function rootAdmin(req,res,next){if(req.auth?.sub!=='admin-root')return res.status(403).json({message:'فقط ادمین اصلی می‌تواند مدیران را مدیریت کند.'});next()}
function calcLevel(xp){return Math.max(1,Math.floor((Number(xp)||0)/1000)+1)}
function skillTemplate(name,xp=0,level=1){return {name,xp,level}}

app.get('/api/health',async(req,res)=>{
 try{
  const db=await readDB();
  res.json({ok:true, database:true, members:(db.members||[]).length});
 }catch(e){
  res.status(500).json({ok:false,error:e.message});
 }
});
app.get('/api/public/announcements',async(req,res)=>{const db=await readDB();res.json({announcements:db.announcements||[]})});
app.get('/api/public/members',async(req,res)=>{const db=await readDB();const members=(db.members||[]).filter(m=>m.profileComplete!==false).sort((a,b)=>(Number(b.level)||0)-(Number(a.level)||0)||(Number(b.xp)||0)-(Number(a.xp)||0));res.json({members:members.map(publicUser)})});

app.post('/api/auth/register',rateLimit({windowMs:60_000,max:10}),async(req,res)=>{try{const body=req.body||{};const phone=normalizePhone(body.phone);if(!/^\+989\d{9}$/.test(phone))return res.status(400).json({message:'شماره موبایل ایران را با فرمت +989xxxxxxxxx وارد کن.'});if(!body.name||!body.focus||!body.goal)return res.status(400).json({message:'نام، حوزه و هدف الزامی است.'});const name=String(body.name).trim();if(name.length<2||name.length>80)return res.status(400).json({message:'نام باید بین ۲ تا ۸۰ کاراکتر باشد.'});const age=body.age===''||body.age==null?null:Number(body.age);if(age!==null&&(!Number.isInteger(age)||age<5||age>120))return res.status(400).json({message:'سن واردشده معتبر نیست.'});const db=await readDB();if(db.members.some(m=>m.phone===phone))return res.status(409).json({message:'این شماره قبلاً ثبت‌نام کرده است. وارد شوید.'});const member={id:randomUUID(),name,age,phone,city:body.city||'',primarySkill:body.focus,skills:[skillTemplate(body.focus,0,1)],focusLevel:body.level||'تازه شروع کردم',goal:body.goal,hours:body.hours||'',future:body.future||'',why:body.why||'',about:body.about||'',xp:0,level:1,ready:false,role:'member',profileComplete:true,roadmap:'ابتدا روی مهارت اصلی خود تمرکز کن، هر هفته یک خروجی قابل بررسی بساز و گزارش پیشرفتت را ارسال کن. پس از مشاهده چند خروجی، تیم GrowLand مسیر بعدی را دقیق‌تر می‌کند.',growth:[...Array(7)].map((_,i)=>({label:`روز ${i+1}`,xp:0})),createdAt:new Date().toISOString()};db.members.push(member);await writeDB(db);const t=tokenFor(member);res.json({user:safeUser(member),token:t});
}catch(err){
 console.error('REGISTER_ERROR',err);
 res.status(500).json({message:err.message || 'خطای سرور'});
}});
app.post('/api/auth/login',rateLimit({windowMs:60_000,max:10}),async(req,res)=>{const phone=normalizePhone(req.body?.phone);if(ADMIN_PHONE && phone===ADMIN_PHONE){const adminUser={id:'admin-root',name:'GrowLand Admin',phone,role:'admin',xp:0,level:1,skills:[],profileComplete:true,ready:true,createdAt:new Date().toISOString(),roadmap:''};const t=tokenFor(adminUser);return res.json({user:adminUser,token:t})}const db=await readDB();const member=db.members.find(m=>m.phone===phone);if(!member)return res.status(404).json({message:'عضوی با این شماره پیدا نشد. ابتدا ثبت‌نام کنید.'});const t=tokenFor(member);res.json({user:safeUser(member),token:t})});
app.get('/api/auth/me',auth,async(req,res)=>{if(req.auth?.sub==='admin-root'){return res.json({user:{id:'admin-root',name:'GrowLand Admin',phone:ADMIN_PHONE,role:'admin',xp:0,level:1,skills:[],profileComplete:true,ready:true}})}const db=await readDB();const m=(db.members||[]).find(x=>x.id===req.auth.sub);if(!m)return res.status(401).json({message:'کاربر یافت نشد.'});res.json({user:safeUser(m)})});

app.get('/api/member/dashboard',auth,async(req,res)=>{if(req.auth?.sub==='admin-root'){return res.json({member:{id:'admin-root',name:'GrowLand Admin',phone:ADMIN_PHONE,role:'admin',xp:0,level:1,skills:[skillTemplate('مدیریت GrowLand',0,1)],ready:true,roadmap:'پنل رشد مدیر اصلی'},reports:[],growth:[...Array(7)].map((_,i)=>({label:`روز ${i+1}`,xp:0}))})}const db=await readDB();const m=(db.members||[]).find(x=>x.id===req.auth.sub);if(!m)return res.status(404).json({message:'کاربر یافت نشد.'});const reports=(db.reports||[]).filter(r=>r.memberId===m.id);res.json({member:safeUser(m),reports,growth:m.growth||[]})});
app.put('/api/member/profile',auth,async(req,res)=>{
 try{
  if(req.auth?.sub==='admin-root') return res.status(403).json({message:'پروفایل مدیر اصلی از این بخش قابل ویرایش نیست.'});
  const db=await readDB();
  const m=(db.members||[]).find(x=>x.id===req.auth.sub);
  if(!m) return res.status(404).json({message:'پروفایل عضو پیدا نشد.'});
  if(req.body.name!==undefined) m.name=String(req.body.name).trim();
  if(req.body.phone!==undefined && req.body.phone!==m.phone){
    const phone=normalizePhone(req.body.phone);
    if(!isValidPhone(phone)) return res.status(400).json({message:'شماره موبایل واردشده معتبر نیست.'});
    if(m.phone===ADMIN_PHONE) return res.status(403).json({message:'شماره مدیر اصلی قابل تغییر نیست.'});
    if((db.members||[]).some(x=>x.id!==m.id && x.phone===phone)) return res.status(409).json({message:'این شماره قبلاً استفاده شده است.'});
    m.phone=phone;
  }
  if(req.body.name!==undefined){m.name=String(req.body.name).trim();if(m.name.length<2)return res.status(400).json({message:'نام باید حداقل ۲ کاراکتر باشد.'});}
  ['city','goal','about','future','why','hours','focusLevel'].forEach(k=>{if(req.body[k]!==undefined)m[k]=String(req.body[k]).trim()});
  if(req.body.age!==undefined){const age=Number(req.body.age);if(req.body.age!=='' && (!Number.isInteger(age)||age<5||age>120))return res.status(400).json({message:'سن واردشده معتبر نیست.'});m.age=req.body.age===''?null:age;}
  if(Array.isArray(req.body.skills))m.skills=req.body.skills;
  await writeDB(db);
  res.json({user:safeUser(m)});
 }catch(e){res.status(500).json({message:e.message||'خطا در ذخیره پروفایل'})}
});

app.patch('/api/member/ready',auth,async(req,res)=>{try{if(req.auth?.sub==='admin-root')return res.status(403).json({message:'وضعیت آمادگی مدیر اصلی قابل تغییر نیست.'});const db=await readDB();const m=(db.members||[]).find(x=>x.id===req.auth.sub);if(!m)return res.status(404).json({message:'عضو یافت نشد.'});m.ready=Boolean(req.body?.ready);await writeDB(db);res.json({user:safeUser(m)})}catch(e){console.error('READY_ERROR',e);res.status(500).json({message:e.message||'خطا در تغییر وضعیت'})}});
app.post('/api/member/reports',auth,async(req,res)=>{try{if(req.auth?.sub==='admin-root')return res.status(403).json({message:'ارسال گزارش برای مدیر اصلی فعال نیست.'});const db=await readDB();const m=(db.members||[]).find(x=>x.id===req.auth.sub);if(!m)return res.status(404).json({message:'عضو یافت نشد.'});const body=String(req.body?.body||'').trim();if(!body)return res.status(400).json({message:'متن گزارش خالی است.'});if(body.length>5000)return res.status(400).json({message:'متن گزارش نباید بیشتر از ۵۰۰۰ کاراکتر باشد.'});db.reports=db.reports||[];db.reports.unshift({id:randomUUID(),memberId:m.id,memberName:m.name,body,createdAt:new Date().toISOString()});await writeDB(db);res.json({ok:true})}catch(e){console.error('REPORT_ERROR',e);res.status(500).json({message:e.message||'خطا در ارسال گزارش'})}});

app.get('/api/admin/overview',auth,admin,async(req,res)=>{const db=await readDB();const members=(db.members||[]).sort((a,b)=>(b.level-a.level)||(b.xp-a.xp));const reports=(db.reports||[]).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));res.json({members:members.map(safeUser),reports})});
app.patch('/api/admin/members/:id',auth,admin,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({message:'عضو یافت نشد.'});if(req.body.xp!==undefined)m.xp=Math.max(0,Number(req.body.xp)||0);if(req.body.level!==undefined)m.level=Math.max(1,Number(req.body.level)||1);else m.level=calcLevel(m.xp);if(req.body.roadmap!==undefined)m.roadmap=String(req.body.roadmap);if(Array.isArray(m.growth)){m.growth.push({label:'امروز',xp:m.xp});m.growth=m.growth.slice(-7)}await writeDB(db);res.json({member:safeUser(m)})});
app.post('/api/admin/members/:id/skills',auth,admin,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({message:'عضو یافت نشد.'});const name=String(req.body?.name||'').trim();if(!name)return res.status(400).json({message:'نام مهارت الزامی است.'});m.skills=m.skills||[];if(!m.skills.some(s=>s.name===name))m.skills.push(skillTemplate(name,Number(req.body?.xp)||0,Number(req.body?.level)||1));await writeDB(db);res.json({member:safeUser(m)})});
app.delete('/api/admin/members/:id',auth,admin,rootAdmin,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({message:'عضو یافت نشد.'});if(m.phone===ADMIN_PHONE)return res.status(400).json({message:'ادمین اصلی قابل حذف نیست.'});db.members=db.members.filter(x=>x.id!==req.params.id);db.reports=(db.reports||[]).filter(x=>x.memberId!==req.params.id);await writeDB(db);res.json({ok:true})});
app.delete('/api/admin/members/:id/skills',auth,admin,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({message:'عضو یافت نشد.'});m.skills=(m.skills||[]).filter(s=>s.name!==req.body?.name);await writeDB(db);res.json({member:safeUser(m)})});
app.patch('/api/admin/role',auth,admin,rootAdmin,async(req,res)=>{const db=await readDB();const phone=normalizePhone(req.body?.phone);const m=db.members.find(x=>x.phone===phone);if(!m)return res.status(404).json({message:'عضو با این شماره پیدا نشد.'});m.role='admin';await writeDB(db);res.json({member:safeUser(m)})});
app.patch('/api/admin/members/:id/role',auth,admin,rootAdmin,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({message:'عضو یافت نشد.'});if(m.phone===ADMIN_PHONE)return res.status(400).json({message:'ادمین اصلی قابل عزل نیست.'});m.role=req.body?.role==='admin'?'admin':'member';await writeDB(db);res.json({member:safeUser(m)})});

app.use((err,req,res,next)=>{
 console.error('API_ERROR',err);
 if(res.headersSent) return next(err);
 if(err?.message==='Origin not allowed by CORS') return res.status(403).json({message:'Origin مجاز نیست.'});
 if(err instanceof SyntaxError && err.status===400 && 'body' in err) return res.status(400).json({message:'بدنه درخواست JSON معتبر نیست.'});
 res.status(500).json({message:err.message || 'خطای داخلی سرور'});
});

if(process.env.NODE_ENV!=='production')app.listen(PORT,()=>console.log(`GrowLand API running on http://localhost:${PORT}`));
export default app;
