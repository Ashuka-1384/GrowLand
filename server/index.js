import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { readDB, writeDB } from './store.js';

const app=express();
const PORT=process.env.PORT||3001;
const JWT_SECRET=process.env.JWT_SECRET;
const ADMIN_PHONE=normalizePhone(process.env.ADMIN_PHONE||'');
app.use(cors({origin:process.env.CLIENT_URL || true,credentials:true}));
app.use(express.json({limit:'1mb'}));

if(!JWT_SECRET){
  console.warn('WARNING: JWT_SECRET is not configured. Set it in production.');
}


function normalizePhone(v=''){let s=String(v).trim().replace(/[\s()-]/g,'');if(s.startsWith('0098'))s='+98'+s.slice(4);if(s.startsWith('09'))s='+98'+s.slice(1);if(s.startsWith('9'))s='+98'+s;return s}
function safeUser(m){const {password,...x}=m;return x}
function tokenFor(m){return jwt.sign({sub:m.id,role:m.role},JWT_SECRET || 'local-development-secret',{expiresIn:'30d'})}
function auth(req,res,next){try{const raw=req.headers.authorization?.replace('Bearer ','')||req.cookies?.token;if(!raw) throw new Error('missing token');
const decoded=jwt.verify(raw,JWT_SECRET || 'local-development-secret');req.auth=decoded;next()}catch{res.status(401).json({message:'نیاز به ورود دارید.'})}}
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
app.get('/api/public/members',async(req,res)=>{const db=await readDB();const members=(db.members||[]).filter(m=>m.profileComplete!==false).sort((a,b)=>(b.level-a.level)||(b.xp-a.xp));res.json({members:members.map(safeUser)})});

app.post('/api/auth/register',async(req,res)=>{try{const body=req.body||{};const phone=normalizePhone(body.phone);if(!/^\+989\d{9}$/.test(phone))return res.status(400).json({message:'شماره موبایل ایران را با فرمت +989xxxxxxxxx وارد کن.'});if(!body.name||!body.focus||!body.goal)return res.status(400).json({message:'نام، حوزه و هدف الزامی است.'});const db=await readDB();if(db.members.some(m=>m.phone===phone))return res.status(409).json({message:'این شماره قبلاً ثبت‌نام کرده است. وارد شوید.'});const member={id:randomUUID(),name:String(body.name).trim(),age:Number(body.age)||null,phone,city:body.city||'',primarySkill:body.focus,skills:[skillTemplate(body.focus,0,1)],focusLevel:body.level||'تازه شروع کردم',goal:body.goal,hours:body.hours||'',future:body.future||'',why:body.why||'',about:body.about||'',xp:0,level:1,ready:false,role:'member',profileComplete:true,roadmap:'ابتدا روی مهارت اصلی خود تمرکز کن، هر هفته یک خروجی قابل بررسی بساز و گزارش پیشرفتت را ارسال کن. پس از مشاهده چند خروجی، تیم GrowLand مسیر بعدی را دقیق‌تر می‌کند.',growth:[...Array(7)].map((_,i)=>({label:`روز ${i+1}`,xp:0})),createdAt:new Date().toISOString()};db.members.push(member);await writeDB(db);const t=tokenFor(member);res.json({user:safeUser(member),token:t});
}catch(err){
 console.error('REGISTER_ERROR',err);
 res.status(500).json({message:err.message || 'خطای سرور'});
}});
app.post('/api/auth/login',async(req,res)=>{const phone=normalizePhone(req.body?.phone);const db=await readDB();let member=db.members.find(m=>m.phone===phone);if(!member && ADMIN_PHONE && phone===ADMIN_PHONE){member={id:'admin-root',name:'GrowLand Admin',phone,role:'admin',xp:0,level:1,skills:[],profileComplete:true,ready:true,createdAt:new Date().toISOString(),roadmap:''};db.members.push(member);await writeDB(db)}if(!member)return res.status(404).json({message:'عضوی با این شماره پیدا نشد. ابتدا ثبت‌نام کنید.'});const t=tokenFor(member);res.json({user:safeUser(member),token:t})});
app.get('/api/auth/me',auth,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.auth.sub);if(!m)return res.status(401).json({message:'کاربر یافت نشد.'});res.json({user:safeUser(m)})});

app.get('/api/member/dashboard',auth,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.auth.sub);if(!m)return res.status(404).json({message:'کاربر یافت نشد.'});const reports=(db.reports||[]).filter(r=>r.memberId===m.id);res.json({member:safeUser(m),reports,growth:m.growth||[]})});
app.patch('/api/member/ready',auth,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.auth.sub);m.ready=Boolean(req.body?.ready);await writeDB(db);res.json({user:safeUser(m)})});
app.post('/api/member/reports',auth,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.auth.sub);const body=String(req.body?.body||'').trim();if(!body)return res.status(400).json({message:'متن گزارش خالی است.'});db.reports=db.reports||[];db.reports.unshift({id:randomUUID(),memberId:m.id,memberName:m.name,body,createdAt:new Date().toISOString()});await writeDB(db);res.json({ok:true})});

app.get('/api/admin/overview',auth,admin,async(req,res)=>{const db=await readDB();const members=(db.members||[]).sort((a,b)=>(b.level-a.level)||(b.xp-a.xp));const reports=(db.reports||[]).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));res.json({members:members.map(safeUser),reports})});
app.patch('/api/admin/members/:id',auth,admin,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({message:'عضو یافت نشد.'});if(req.body.xp!==undefined)m.xp=Math.max(0,Number(req.body.xp)||0);if(req.body.level!==undefined)m.level=Math.max(1,Number(req.body.level)||1);else m.level=calcLevel(m.xp);if(req.body.roadmap!==undefined)m.roadmap=String(req.body.roadmap);if(Array.isArray(m.growth)){m.growth.push({label:'امروز',xp:m.xp});m.growth=m.growth.slice(-7)}await writeDB(db);res.json({member:safeUser(m)})});
app.post('/api/admin/members/:id/skills',auth,admin,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({message:'عضو یافت نشد.'});const name=String(req.body?.name||'').trim();if(!name)return res.status(400).json({message:'نام مهارت الزامی است.'});m.skills=m.skills||[];if(!m.skills.some(s=>s.name===name))m.skills.push(skillTemplate(name,Number(req.body?.xp)||0,Number(req.body?.level)||1));await writeDB(db);res.json({member:safeUser(m)})});
app.delete('/api/admin/members/:id/skills',auth,admin,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({message:'عضو یافت نشد.'});m.skills=(m.skills||[]).filter(s=>s.name!==req.body?.name);await writeDB(db);res.json({member:safeUser(m)})});
app.patch('/api/admin/role',auth,admin,rootAdmin,async(req,res)=>{const db=await readDB();const phone=normalizePhone(req.body?.phone);const m=db.members.find(x=>x.phone===phone);if(!m)return res.status(404).json({message:'عضو با این شماره پیدا نشد.'});m.role='admin';await writeDB(db);res.json({member:safeUser(m)})});
app.patch('/api/admin/members/:id/role',auth,admin,rootAdmin,async(req,res)=>{const db=await readDB();const m=db.members.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({message:'عضو یافت نشد.'});if(m.phone===ADMIN_PHONE)return res.status(400).json({message:'ادمین اصلی قابل عزل نیست.'});m.role=req.body?.role==='admin'?'admin':'member';await writeDB(db);res.json({member:safeUser(m)})});

app.use((err,req,res,next)=>{
 console.error('API_ERROR',err);
 res.status(500).json({message:err.message || 'خطای داخلی سرور'});
});

if(process.env.NODE_ENV!=='production')app.listen(PORT,()=>console.log(`GrowLand API running on http://localhost:${PORT}`));
export default app;
