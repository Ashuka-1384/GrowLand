import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '/api';
const DEFAULT_SKILLS = ['طراحی','برنامه‌نویسی','تولید محتوا','فروش و مذاکره','مهارت‌های فردی','کسب‌وکار','نویسندگی','زبان'];

async function api(path, options={}) {
  const token = localStorage.getItem('growland_token');
  const res = await fetch(`${API}${path}`, { headers: {'Content-Type':'application/json', ...(token ? {'Authorization': `Bearer ${token}`} : {}), ...(options.headers||{})}, credentials:'include', ...options });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.message || 'خطایی رخ داد');
  return data;
}

function useAuth() {
  const [auth, setAuth] = useState({loading:true, user:null});
  const refresh = async () => {
    const token = localStorage.getItem('growland_token');
    if (!token) {
      setAuth({loading:false,user:null});
      return;
    }
    try {
      const data = await api('/auth/me');
      setAuth({loading:false,user:data.user});
    } catch {
      // A stale/expired token should not keep producing a 401 on every page load.
      localStorage.removeItem('growland_token');
      setAuth({loading:false,user:null});
    }
  };
  useEffect(()=>{ refresh(); },[]);
  return { ...auth, refresh };
}

function App(){
  const auth = useAuth();
  if(auth.loading) return <div className="splash"><div className="loader"></div><span>در حال آماده‌سازی GrowLand…</span></div>;
  return <Routes>
    <Route path="*" element={<Site auth={auth}/>}/>
  </Routes>
}

function Site({auth}){
  return <div className="app-shell">
    <Navbar user={auth.user}/>
    <main>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/signup" element={<Signup onAuth={auth.refresh}/>}/>
        <Route path="/signin" element={<Signin onAuth={auth.refresh}/>}/>
        <Route path="/members" element={<Members/>}/>
        <Route path="/dashboard" element={auth.user ? <Dashboard user={auth.user}/> : <Navigate to="/signin" replace/>}/>
        <Route path="/admin" element={auth.user?.role === 'admin' ? <Admin user={auth.user}/> : <Navigate to="/signin" replace/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </main>
    <Footer/>
  </div>
}

function Navbar({user}){
  const [open,setOpen]=useState(false);
  return <header className="navbar">
    <div className="nav-inner container">
      <Link className="brand" to="/"><img src="/growland-logo.jpg" alt="GrowLand"/><span>GrowLand</span></Link>
      <button className="menu-toggle" onClick={()=>setOpen(!open)} aria-label="منو">☰</button>
      <nav className={open?'nav-links open':'nav-links'} onClick={()=>setOpen(false)}>
        <a href="/#about">درباره ما</a><a href="https://example.com">آرشیو</a><NavLink to="/members">همه اعضا</NavLink>
        {user ? <NavLink to="/dashboard">پنل رشد</NavLink> : <NavLink to="/signin">ورود</NavLink>}
        {!user && <NavLink className="nav-cta" to="/signup">عضویت</NavLink>}
        {user?.role==='admin' && <NavLink to="/admin">پنل ادمین</NavLink>}{user && <button className="nav-logout" onClick={()=>{localStorage.removeItem('growland_token');window.location.href='/signin'}}>خروج</button>}
      </nav>
    </div>
  </header>
}

function Home(){
  return <>
    <section className="hero" id="about">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Growth → Proof → Capability → Opportunity</span>
          <h1>رشدت را فقط نگو؛ <span>نشانش بده.</span></h1>
          <p>GrowLand یک اکوسیستم رشد فردی، مهارتی و شغلی است؛ جایی که یادگیری به عمل، خروجی، شواهد و در نهایت فرصت واقعی تبدیل می‌شود.</p>
          <div className="hero-actions"><Link to="/signup" className="btn primary">شروع مسیر رشد</Link><a href="#journey" className="btn ghost">آشنایی با مسیر</a></div>
          <div className="hero-stats"><div><b>XP</b><span>اندازه‌گیری فعالیت</span></div><div><b>Level</b><span>رشد تجمعی</span></div><div><b>Proof</b><span>شواهد عملکرد</span></div></div>
        </div>
        <div className="hero-art"><div className="orbit orbit-a"></div><div className="orbit orbit-b"></div><div className="hero-logo-card"><img src="/growland-logo.jpg" alt="GrowLand logo"/><p>GROW TOGETHER, GO FURTHER</p></div></div>
      </div>
    </section>

    <section className="section light" id="fields"><div className="container"><SectionTitle kicker="GrowLand در چه حوزه‌هایی؟" title="مسیرت را از یک مهارت مشخص شروع کن" text="حوزه‌ها قابل مشاهده و قابل سنجش‌اند تا هر عضو بداند روی چه چیزی تمرکز کرده و قدم بعدی چیست."/><div className="field-grid">{DEFAULT_SKILLS.map((x,i)=><div className="field-card" key={x}><span>{String(i+1).padStart(2,'0')}</span><h3>{x}</h3><p>یادگیری → فعالیت → خروجی → بازخورد</p></div>)}</div></div></section>

    <section className="section" id="journey"><div className="container"><SectionTitle kicker="Member Journey" title="از ورود تا توانمندی" text="مدل GrowLand فاصله میان رشد و شایستگی واقعی برای کار را کم می‌کند."/><div className="journey">{['Member','Growth','Skill','Proof','Level','Competition','Assessment','Job Ready','Job','Income'].map((x,i)=><div className="journey-item" key={x}><div className="journey-num">{i+1}</div><b>{x}</b>{i<9 && <span>↓</span>}</div>)}</div></div></section>

    <section className="section dark"><div className="container split"><div><span className="eyebrow">Top Members</span><h2>رشد واقعی، قابل مشاهده است.</h2><p>پروفایل اعضا فقط اسم و عکس نیست؛ پرونده‌ای از سطح، مهارت‌ها، XP و روند رشد است.</p><Link className="btn light-btn" to="/members">مشاهده اعضا</Link></div><MiniRanking/></div></section>

    <section className="section announcements"><div className="container"><SectionTitle kicker="اطلاعیه‌ها" title="آخرین اتفاقات GrowLand"/><Announcements/></div></section>
    <section className="section ranking-preview"><div className="container"><SectionTitle kicker="Ranking" title="رتبه‌بندی بر اساس رشد و XP" text="در این نسخه، Level از XP کلی به دست می‌آید و هر 1000 XP یک Level است."/><Ranking/></div></section>
  </>
}

function SectionTitle({kicker,title,text}){return <div className="section-title"><span className="eyebrow">{kicker}</span><h2>{title}</h2>{text&&<p>{text}</p>}</div>}

function Announcements(){
 const [items,setItems]=useState([]); useEffect(()=>{api('/public/announcements').then(d=>setItems(d.announcements)).catch(()=>{});},[]);
 return <div className="announcement-grid">{(items.length?items:[{title:'شروع مسیر',body:'ثبت‌نام کن و اولین مسیر رشد خودت را بساز.'},{title:'XP بر اساس عمل',body:'فعالیت‌های قابل بررسی و خروجی واقعی، موتور امتیازدهی هستند.'}]).map(x=><article className="notice" key={x.id||x.title}><span>اعلان</span><h3>{x.title}</h3><p>{x.body}</p></article>)}</div>
}

function Ranking(){
 const [members,setMembers]=useState([]); useEffect(()=>{api('/public/members').then(d=>setMembers(d.members)).catch(()=>{});},[]);
 const top=members.slice(0,5); return <div className="ranking-list">{top.length?top.map((m,i)=><ProfileRow key={m.id} member={m} index={i}/>):<div className="empty">هنوز عضو فعالی برای نمایش در رتبه‌بندی ثبت نشده است.</div>}</div>
}

function MiniRanking(){
 const [members,setMembers]=useState([]);
 useEffect(()=>{
   let active=true;
   api('/public/members').then(d=>{if(active)setMembers(d.members||[]);}).catch(()=>{if(active)setMembers([]);});
   return ()=>{active=false;};
 },[]);
 const top=members.slice(0,3);
 return <div className="mini-ranking">
   {top.length ? top.map((m,i)=><ProfileRow key={m.id} member={m} index={i}/>) : <div className="empty">هنوز عضو فعالی برای نمایش در رتبه‌بندی ثبت نشده است.</div>}
 </div>;
}
function ProfileRow({member,index}){return <div className="rank-row"><span className="rank-num">#{index+1}</span><div className="avatar">{initials(member.name)}</div><div className="rank-main"><b>{member.name}</b><span>{member.primarySkill || 'در حال انتخاب مسیر'}</span></div><div className="rank-xp"><b>Lv.{member.level||1}</b><span>{member.xp||0} XP</span></div></div>}
function initials(name='G'){return name.split(' ').map(x=>x[0]).slice(0,2).join('')}

function Signup({onAuth}){
 const [form,setForm]=useState({name:'',age:'',phone:'',city:'',focus:'',level:'تازه شروع کردم',goal:'',hours:'۳ تا ۵ ساعت',future:'',why:'',about:''}); const [msg,setMsg]=useState(''); const nav=useNavigate();
 const submit=async e=>{e.preventDefault();setMsg('');try{const result=await api('/auth/register',{method:'POST',body:JSON.stringify(form)});localStorage.setItem('growland_token',result.token);await onAuth();nav('/dashboard')}catch(err){setMsg(err.message)}};
 return <div className="auth-page container"><div className="form-shell"><div className="form-intro"><span className="eyebrow">🌱 فرم ثبت‌نام GrowLand</span><h1>شروع مسیر رشد</h1><p>قرار نیست فقط عضو یک کامیونیتی باشی؛ قرار است مسیر رشدت را بسازی، ببینی و به توانمندی تبدیل کنی.</p><div className="quote">«یاد بگیر → انجام بده → خروجی بساز → بازخورد بگیر → رشدت را ثابت کن»</div></div><form onSubmit={submit} className="form-grid">
 {[["name","نام و نام خانوادگی","text"],["age","سن","number"],["phone","شماره تماس","tel"],["city","شهر و محل زندگی","text"]].map(([k,l,t])=><Field key={k} label={l}><input required type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={k==='phone'?'+98 9xx xxx xxxx':''}/></Field>)}
 <Field label="در حال حاضر بیشتر روی کدام حوزه تمرکز داری؟"><select required value={form.focus} onChange={e=>setForm({...form,focus:e.target.value})}><option value="">انتخاب حوزه</option>{DEFAULT_SKILLS.map(x=><option key={x}>{x}</option>)}<option>سایر</option></select></Field>
 <Field label="در این حوزه چه سطحی داری?"><select value={form.level} onChange={e=>setForm({...form,level:e.target.value})}>{['تازه شروع کردم','مقدماتی','متوسط','خوب','حرفه‌ای'].map(x=><option key={x}>{x}</option>)}</select></Field>
 <Field label="مهم‌ترین هدفت از ورود به GrowLand چیست؟"><select required value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})}><option value="">انتخاب هدف</option>{['توسعه یک مهارت','ساختن رزومه و نمونه‌کار','افزایش اعتمادبه‌نفس و مهارت‌های فردی','آماده شدن برای ورود به بازار کار','پیدا کردن مسیر شغلی','رسیدن به درآمد','سایر'].map(x=><option key={x}>{x}</option>)}</select></Field>
 <Field label="هفته‌ای چقدر زمان می‌توانی برای رشد اختصاص بدهی؟"><select value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})}>{['کمتر از ۳ ساعت','۳ تا ۵ ساعت','۵ تا ۱۰ ساعت','بیشتر از ۱۰ ساعت'].map(x=><option key={x}>{x}</option>)}</select></Field>
 {[["future","اگر قرار باشد در ۳ ماه آینده فقط در یک چیز پیشرفت چشمگیری داشته باشی، آن چیست؟"],["why","چرا فکر می‌کنی GrowLand می‌تواند به رشدت کمک کند؟"],["about","یک جمله درباره خودت: من کسی هستم که..."]].map(([k,l])=><Field key={k} label={l} wide><textarea required value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></Field>)}
 {msg&&<div className="error wide">{msg}</div>}<div className="wide form-submit"><button className="btn primary" type="submit">ثبت‌نام و شروع مسیر</button><span>پس از ثبت‌نام، پنل رشد شخصی در دسترس قرار می‌گیرد.</span></div>
 </form></div></div>
}
function Field({label,children,wide}){return <label className={wide?'field wide':'field'}><span>{label}</span>{children}</label>}

function Signin({onAuth}){const [phone,setPhone]=useState('');const [msg,setMsg]=useState('');const nav=useNavigate();const submit=async e=>{e.preventDefault();try{const result=await api('/auth/login',{method:'POST',body:JSON.stringify({phone})});localStorage.setItem('growland_token',result.token);await onAuth();nav('/dashboard')}catch(err){setMsg(err.message)}};return <div className="auth-page container"><div className="login-card"><img src="/growland-logo.jpg"/><span className="eyebrow">ورود بدون SMS</span><h1>به مسیرت برگرد</h1><p>شماره‌ای که هنگام ثبت‌نام وارد کردی را با پیش‌شماره +98 وارد کن.</p><form onSubmit={submit}><Field label="شماره تماس"><input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+989123456789"/></Field>{msg&&<div className="error">{msg}</div>}<button className="btn primary full">ورود به پنل</button></form><Link to="/signup" className="back-link">هنوز عضو نیستی؟ ثبت‌نام کن</Link></div></div>}

function Members(){const [members,setMembers]=useState([]);useEffect(()=>{api('/public/members').then(d=>setMembers(d.members)).catch(()=>{});},[]);return <div className="page container"><SectionTitle kicker="Community" title="همه اعضای GrowLand" text="کارت پروفایل اعضا بر اساس اطلاعات تکمیل‌شده و وضعیت رشد نمایش داده می‌شود."/><div className="member-grid">{members.map(m=><MemberCard key={m.id} member={m}/>)}</div>{!members.length&&<div className="empty large">هنوز پروفایل عمومی‌ای برای نمایش وجود ندارد.</div>}</div>}
function MemberCard({member}){return <article className="member-card"><div className="member-head"><div className="avatar big">{initials(member.name)}</div><div><h3>{member.name}</h3><span>{member.primarySkill||'مسیر در حال تنظیم'}</span></div><b className="level-badge">Lv.{member.level||1}</b></div><div className="xpbar"><span style={{width:`${Math.min(100,(member.xp%1000)/10)}%`}}></span></div><div className="member-meta"><span>{member.xp||0} XP</span><span>{member.skills?.length||0} مهارت</span><span>{member.ready?'آماده کار':'در مسیر رشد'}</span></div><div className="tags">{(member.skills||[]).slice(0,4).map(s=><span key={s.name}>{s.name}</span>)}</div></article>}

function Dashboard({user}){const [data,setData]=useState(null);const [report,setReport]=useState('');const [msg,setMsg]=useState('');const load=()=>api('/member/dashboard').then(setData);useEffect(()=>{load()},[]);if(!data)return <div className="page container"><div className="loader"></div></div>;const skills=data.member.skills||[];return <div className="page container"><div className="dashboard-head"><div><span className="eyebrow">Growth Dashboard</span><h1>سلام {user.name.split(' ')[0]} 👋</h1><p>اینجا می‌توانی رشد، XP، مهارت‌ها و مسیر پیشنهادی خودت را ببینی.</p></div><div className={data.member.ready?'ready-toggle active':'ready-toggle'} onClick={async()=>{await api('/member/ready',{method:'PATCH',body:JSON.stringify({ready:!data.member.ready})});load()}}><span></span>{data.member.ready?'آماده کار':'هنوز در مسیر رشد'}</div></div><div className="dashboard-grid"><StatCard title="Level" value={data.member.level||1} sub={`${data.member.xp||0} XP`}/><StatCard title="XP" value={data.member.xp||0} sub="امتیاز رشد"/><StatCard title="مهارت‌ها" value={skills.length} sub="حوزه فعال"/><StatCard title="گزارش‌ها" value={data.reports.length} sub="ارسال‌شده"/><div className="panel wide-panel"><div className="panel-title"><h2>رادار مهارت‌ها</h2><span>سطح فعلی</span></div><RadarChart skills={skills}/></div><div className="panel"><div className="panel-title"><h2>XP مهارت‌ها</h2></div><SkillXP skills={skills}/></div><div className="panel"><div className="panel-title"><h2>رشد ۷ روز اخیر</h2></div><LineChart data={data.growth}/></div><div className="panel wide-panel"><div className="panel-title"><h2>Roadmap اختصاصی</h2></div><div className="roadmap-text">{data.member.roadmap || 'تیم GrowLand پس از بررسی مسیرت، برنامه رشد اختصاصی را اینجا قرار می‌دهد.'}</div></div><div className="panel wide-panel"><div className="panel-title"><h2>ارسال گزارش برای ادمین</h2></div><textarea className="report-box" value={report} onChange={e=>setReport(e.target.value)} placeholder="امروز چه کاری انجام دادی؟ چه خروجی یا شواهدی داری؟"></textarea><div className="report-actions"><button className="btn primary" onClick={async()=>{try{await api('/member/reports',{method:'POST',body:JSON.stringify({body:report})});setReport('');setMsg('گزارش ارسال شد.');load()}catch(e){setMsg(e.message)}}}>ارسال گزارش</button>{msg&&<span>{msg}</span>}</div></div></div></div>}
function StatCard({title,value,sub}){return <div className="stat-card"><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>}

function RadarChart({skills}){const vals=skills.slice(0,6);if(!vals.length)return <div className="empty">مهارتی ثبت نشده است.</div>;const n=vals.length,cx=150,cy=120,r=85,pts=vals.map((s,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]});const poly=vals.map((s,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;const rr=r*Math.min(1,(s.level||0)/5);return `${cx+Math.cos(a)*rr},${cy+Math.sin(a)*rr}`}).join(' ');return <div className="radar-wrap"><svg viewBox="0 0 300 250"><polygon points={pts.map(p=>p.join(',')).join(' ')} fill="none" stroke="currentColor" opacity=".18"/><polygon points={vals.map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return `${cx+Math.cos(a)*r*.5},${cy+Math.sin(a)*r*.5}`}).join(' ')} fill="none" stroke="currentColor" opacity=".12"/><polygon points={poly} fill="currentColor" opacity=".25" stroke="currentColor" strokeWidth="2"/>{vals.map((s,i)=>{const [x,y]=pts[i];return <g key={s.name}><circle cx={x} cy={y} r="3" fill="currentColor"/><text x={x} y={y+(y<cy?-8:16)} textAnchor="middle" fontSize="9">{s.name.slice(0,12)}</text></g>})}</svg></div>}
function SkillXP({skills}){return <div className="skill-list">{skills.map(s=><div className="skill-line" key={s.name}><div><span>{s.name}</span><b>{s.xp||0} XP</b></div><div className="xpbar"><span style={{width:`${Math.min(100,((s.xp||0)%1000)/10)}%`}}/></div></div>)}</div>}
function LineChart({data=[]}){const vals=data.map(x=>x.xp||0);const max=Math.max(...vals,1),min=Math.min(...vals,0);const points=vals.map((v,i)=>`${10+i*(180/Math.max(vals.length-1,1))},${100-((v-min)/(max-min||1))*80}`).join(' ');return <div className="line-wrap"><svg viewBox="0 0 200 120"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{data.map((x,i)=><text key={i} x={10+i*(180/Math.max(data.length-1,1))} y="115" textAnchor="middle" fontSize="7">{x.label}</text>)}</svg></div>}

function Admin({user}){const [data,setData]=useState(null);const [selected,setSelected]=useState(null);const [tab,setTab]=useState('members');const [notice,setNotice]=useState('');const load=()=>api('/admin/overview').then(setData);useEffect(()=>{load()},[]);if(!data)return <div className="page container"><div className="loader"></div></div>;return <div className="page container"><div className="admin-head"><div><span className="eyebrow">Admin System</span><h1>پنل مدیریت GrowLand</h1><p>همه ادمین‌ها از یک پنل واحد برای اعتبارسنجی رشد و مدیریت اعضا استفاده می‌کنند.</p></div><div className="admin-pill">مدیر: {user.name}</div></div><div className="admin-tabs"><button className={tab==='members'?'active':''} onClick={()=>setTab('members')}>اعضا</button><button className={tab==='reports'?'active':''} onClick={()=>setTab('reports')}>گزارش‌ها <b>{data.reports.length}</b></button><button className={tab==='admins'?'active':''} onClick={()=>setTab('admins')}>ادمین‌ها</button></div>{tab==='members'&&<AdminMembers members={data.members} onSelect={setSelected}/>} {tab==='reports'&&<Reports reports={data.reports}/>} {tab==='admins'&&<AdminManagers members={data.members} onDone={()=>{load();setNotice('تغییرات ذخیره شد.')}}/>}{selected&&<AdminMemberModal member={selected} onClose={()=>setSelected(null)} onDone={()=>{setSelected(null);load();setNotice('پروفایل عضو به‌روزرسانی شد.')}}/>}{notice&&<div className="toast" onClick={()=>setNotice('')}>{notice}</div>}</div>}
function AdminMembers({members,onSelect}){return <div className="admin-members">{members.map(m=><button key={m.id} className="admin-member-row" onClick={()=>onSelect(m)}><div className="avatar">{initials(m.name)}</div><div><b>{m.name}</b><span>{m.phone} · {m.primarySkill}</span></div><div className="admin-row-right"><b>Lv.{m.level}</b><span>{m.xp} XP</span></div></button>)}{!members.length&&<div className="empty large">هنوز عضوی ثبت نشده است.</div>}</div>}
function Reports({reports}){return <div className="reports-list">{reports.map(r=><article className="report-card" key={r.id}><div><b>{r.memberName}</b><span>{new Date(r.createdAt).toLocaleString('fa-IR')}</span></div><p>{r.body}</p></article>)}{!reports.length&&<div className="empty large">گزارشی برای بررسی وجود ندارد.</div>}</div>}
function AdminManagers({members,onDone}){const [phone,setPhone]=useState('');const promote=async()=>{try{await api('/admin/role',{method:'PATCH',body:JSON.stringify({phone,role:'admin'})});setPhone('');onDone()}catch(e){alert(e.message)}};const demote=async id=>{try{await api(`/admin/members/${id}/role`,{method:'PATCH',body:JSON.stringify({role:'member'})});onDone()}catch(e){alert(e.message)}};return <div className="admin-managers"><div className="promote-box"><h3>ارتقای عضو به ادمین</h3><div className="inline-form"><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+989..."/><button className="btn primary" onClick={promote}>ارتقا</button></div></div><div className="admin-list">{members.filter(m=>m.role==='admin').map(m=><div className="admin-item" key={m.id}><div><b>{m.name}</b><span>{m.phone}</span></div><button className="btn danger" onClick={()=>demote(m.id)}>عزل ادمین</button></div>)}</div></div>}
function AdminMemberModal({member,onClose,onDone}){const [xp,setXp]=useState(member.xp);const [level,setLevel]=useState(member.level);const [skill,setSkill]=useState('');const [roadmap,setRoadmap]=useState(member.roadmap||'');const save=async()=>{try{await api(`/admin/members/${member.id}`,{method:'PATCH',body:JSON.stringify({xp:Number(xp),level:Number(level),roadmap})});if(skill.trim()){await api(`/admin/members/${member.id}/skills`,{method:'POST',body:JSON.stringify({name:skill.trim(),xp:0,level:1})});}onDone()}catch(e){alert(e.message)}};const removeSkill=async(name)=>{try{await api(`/admin/members/${member.id}/skills`,{method:'DELETE',body:JSON.stringify({name})});onDone()}catch(e){alert(e.message)}};const deleteMember=async()=>{if(!confirm('آیا از حذف این عضو مطمئن هستید؟'))return;try{await api(`/admin/members/${member.id}`,{method:'DELETE'});onDone()}catch(e){alert(e.message)}};return <div className="modal-backdrop"><div className="modal"><button className="modal-close" onClick={onClose}>×</button><div className="member-head"><div className="avatar big">{initials(member.name)}</div><div><h2>{member.name}</h2><span>{member.phone}</span></div></div><div className="modal-grid"><Field label="XP"><input type="number" value={xp} onChange={e=>setXp(e.target.value)}/></Field><Field label="Level"><input type="number" value={level} onChange={e=>setLevel(e.target.value)}/></Field><Field label="افزودن مهارت"><input value={skill} onChange={e=>setSkill(e.target.value)} placeholder="نام مهارت جدید"/></Field><Field label="Roadmap" wide><textarea value={roadmap} onChange={e=>setRoadmap(e.target.value)}/></Field></div><div className="tags admin-tags">{(member.skills||[]).map(s=><button key={s.name} onClick={()=>removeSkill(s.name)}>{s.name} ×</button>)}</div><button className="btn danger full" onClick={deleteMember}>حذف عضو</button><button className="btn primary full" onClick={save}>ذخیره تغییرات</button></div></div>}

function Footer(){return <footer><div className="container footer-inner"><div><b>GrowLand</b><p>رشد → اثبات → توانمندی → فرصت</p></div><span>© {new Date().getFullYear()} GrowLand</span></div></footer>}

createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
