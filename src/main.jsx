import React, { Component, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './styles.css';

const API = String(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const DEFAULT_SKILLS = ['طراحی','برنامه‌نویسی','تولید محتوا','فروش و مذاکره','مهارت‌های فردی','کسب‌وکار','نویسندگی','زبان'];
let publicMembersRequest = null;
function getPublicMembers(){
  if(!publicMembersRequest){
    publicMembersRequest = api('/public/members').finally(()=>{publicMembersRequest=null;});
  }
  return publicMembersRequest;
}

async function api(path, options={}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout ?? 15000);
  try {
    const { timeout: _timeout, headers: customHeaders, ...requestOptions } = options;
    const headers = {
      'Content-Type': 'application/json',
      ...(customHeaders || {})
    };
    const res = await fetch(`${API}${path}`, {
      ...requestOptions,
      headers,
      credentials: 'include',
      signal: controller.signal
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('growland:auth-expired'));
      }
      throw new Error(data.message || `خطای سرور (${res.status})`);
    }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('درخواست بیش از حد طول کشید. دوباره تلاش کنید.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function useAuth() {
  const [auth, setAuth] = useState({loading:true, user:null});
  const refresh = useCallback(async () => {
    try {
      const data = await api('/auth/me');
      setAuth({loading:false,user:data.user});
      return data.user;
    } catch {
      setAuth({loading:false,user:null});
      return null;
    }
  },[]);
  useEffect(()=>{
    refresh();
    const onExpired=()=>setAuth({loading:false,user:null});
    window.addEventListener('growland:auth-expired',onExpired);
    return ()=>window.removeEventListener('growland:auth-expired',onExpired);
  },[refresh]);
  return { ...auth, refresh };
}

class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state={hasError:false}; }
  static getDerivedStateFromError(){ return {hasError:true}; }
  componentDidCatch(error,info){ console.error('GROWLAND_REACT_ERROR',error,info); }
  render(){
    if(this.state.hasError) return <div className="page container"><div className="error">یک خطای غیرمنتظره در نمایش صفحه رخ داد. لطفاً صفحه را تازه‌سازی کنید.</div></div>;
    return this.props.children;
  }
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
        <a href="/#about">درباره ما</a><a href="/#journey">مسیر رشد</a><NavLink to="/members">همه اعضا</NavLink>
        {user ? <NavLink to="/dashboard">پنل رشد</NavLink> : <NavLink to="/signin">ورود</NavLink>}
        {!user && <NavLink className="nav-cta" to="/signup">عضویت</NavLink>}
        {user?.role==='admin' && <NavLink to="/admin">پنل ادمین</NavLink>}{user && <button className="nav-logout" onClick={async()=>{try{await api('/auth/logout',{method:'POST'})}finally{window.location.href='/signin'}}}>خروج</button>}
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
 const [items,setItems]=useState([]); const [error,setError]=useState('');
 useEffect(()=>{api('/public/announcements').then(d=>setItems(d.announcements||[])).catch(e=>setError(e.message||'خطا در دریافت اطلاعیه‌ها.'));},[]);
 if(error) return <div className="panel"><div className="error">{error}</div></div>;
 return <div className="announcement-grid">{(items.length?items:[{title:'شروع مسیر',body:'ثبت‌نام کن و اولین مسیر رشد خودت را بساز.'},{title:'XP بر اساس عمل',body:'فعالیت‌های قابل بررسی و خروجی واقعی، موتور امتیازدهی هستند.'}]).map(x=><article className="notice" key={x.id||x.title}><span>اعلان</span><h3>{x.title}</h3><p>{x.body}</p></article>)}</div>
}

function Ranking(){
 const [members,setMembers]=useState([]); const [error,setError]=useState(''); useEffect(()=>{let active=true;getPublicMembers().then(d=>{if(active)setMembers(d.members||[])}).catch(e=>{if(active)setError(e.message||'خطا در دریافت اعضا.')});return()=>{active=false};},[]);
 const top=members.slice(0,5); return <div className="ranking-list">{error&&<div className="error">{error}</div>}{top.length?top.map((m,i)=><ProfileRow key={m.id} member={m} index={i}/>):<div className="empty">هنوز عضو فعالی برای نمایش در رتبه‌بندی ثبت نشده است.</div>}</div>
}

function MiniRanking(){
 const [members,setMembers]=useState([]);
 useEffect(()=>{
   let active=true;
   getPublicMembers().then(d=>{if(active)setMembers(d.members||[]);}).catch(()=>{if(active)setMembers([]);});
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
 const [form,setForm]=useState({name:'',age:'',phone:'',password:'',city:'',focus:'',level:'تازه شروع کردم',goal:'',hours:'۳ تا ۵ ساعت',future:'',why:'',about:''}); const [msg,setMsg]=useState(''); const [submitting,setSubmitting]=useState(false); const nav=useNavigate();
 const submit=async e=>{e.preventDefault();if(submitting)return;setSubmitting(true);setMsg('');try{await api('/auth/register',{method:'POST',body:JSON.stringify(form)});await onAuth();nav('/dashboard')}catch(err){setMsg(err.message)}finally{setSubmitting(false)}};
 return <div className="auth-page container"><div className="form-shell"><div className="form-intro"><span className="eyebrow">🌱 فرم ثبت‌نام GrowLand</span><h1>شروع مسیر رشد</h1><p>قرار نیست فقط عضو یک کامیونیتی باشی؛ قرار است مسیر رشدت را بسازی، ببینی و به توانمندی تبدیل کنی.</p><div className="quote">«یاد بگیر → انجام بده → خروجی بساز → بازخورد بگیر → رشدت را ثابت کن»</div></div><form onSubmit={submit} className="form-grid">
 {[["name","نام و نام خانوادگی","text"],["age","سن","number"],["phone","شماره تماس","tel"],["city","شهر و محل زندگی","text"]].map(([k,l,t])=><Field key={k} label={l}><input required type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={k==='phone'?'+98 9xx xxx xxxx':''}/></Field>)}<Field label="رمز عبور"><input required minLength="8" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="حداقل ۸ کاراکتر"/></Field>
 <Field label="در حال حاضر بیشتر روی کدام حوزه تمرکز داری؟"><select required value={form.focus} onChange={e=>setForm({...form,focus:e.target.value})}><option value="">انتخاب حوزه</option>{DEFAULT_SKILLS.map(x=><option key={x}>{x}</option>)}<option>سایر</option></select></Field>
 <Field label="در این حوزه چه سطحی داری?"><select value={form.level} onChange={e=>setForm({...form,level:e.target.value})}>{['تازه شروع کردم','مقدماتی','متوسط','خوب','حرفه‌ای'].map(x=><option key={x}>{x}</option>)}</select></Field>
 <Field label="مهم‌ترین هدفت از ورود به GrowLand چیست؟"><select required value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})}><option value="">انتخاب هدف</option>{['توسعه یک مهارت','ساختن رزومه و نمونه‌کار','افزایش اعتمادبه‌نفس و مهارت‌های فردی','آماده شدن برای ورود به بازار کار','پیدا کردن مسیر شغلی','رسیدن به درآمد','سایر'].map(x=><option key={x}>{x}</option>)}</select></Field>
 <Field label="هفته‌ای چقدر زمان می‌توانی برای رشد اختصاص بدهی؟"><select value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})}>{['کمتر از ۳ ساعت','۳ تا ۵ ساعت','۵ تا ۱۰ ساعت','بیشتر از ۱۰ ساعت'].map(x=><option key={x}>{x}</option>)}</select></Field>
 {[["future","اگر قرار باشد در ۳ ماه آینده فقط در یک چیز پیشرفت چشمگیری داشته باشی، آن چیست؟"],["why","چرا فکر می‌کنی GrowLand می‌تواند به رشدت کمک کند؟"],["about","یک جمله درباره خودت: من کسی هستم که..."]].map(([k,l])=><Field key={k} label={l} wide><textarea required value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></Field>)}
 {msg&&<div className="error wide">{msg}</div>}<div className="wide form-submit"><button className="btn primary" type="submit" disabled={submitting}>{submitting?'در حال ثبت‌نام…':'ثبت‌نام و شروع مسیر'}</button><span>پس از ثبت‌نام، پنل رشد شخصی در دسترس قرار می‌گیرد.</span></div>
 </form></div></div>
}
function Field({label,children,wide}){return <label className={wide?'field wide':'field'}><span>{label}</span>{children}</label>}

function Signin({onAuth}){
 const [phone,setPhone]=useState(''); const [password,setPassword]=useState(''); const [msg,setMsg]=useState(''); const [submitting,setSubmitting]=useState(false); const nav=useNavigate();
 const submit=async e=>{e.preventDefault();if(submitting)return;setSubmitting(true);setMsg('');try{await api('/auth/login',{method:'POST',body:JSON.stringify({phone,password})});await onAuth();nav('/dashboard')}catch(err){setMsg(err.message)}finally{setSubmitting(false)}};
 return <div className="auth-page container"><div className="login-card"><img src="/growland-logo.jpg"/><span className="eyebrow">ورود امن</span><h1>به مسیرت برگرد</h1><p>شماره موبایل و رمز عبوری که هنگام ثبت‌نام تعیین کردی را وارد کن.</p><form onSubmit={submit}><Field label="شماره تماس"><input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+989123456789"/></Field><Field label="رمز عبور"><input required minLength="8" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="حداقل ۸ کاراکتر"/></Field>{msg&&<div className="error">{msg}</div>}<button className="btn primary full" disabled={submitting}>{submitting?'در حال ورود…':'ورود به پنل'}</button></form><Link to="/signup" className="back-link">هنوز عضو نیستی؟ ثبت‌نام کن</Link></div></div>
}

function Members(){const [members,setMembers]=useState([]);const [error,setError]=useState('');useEffect(()=>{let active=true;getPublicMembers().then(d=>{if(active)setMembers(d.members||[])}).catch(e=>{if(active)setError(e.message||'خطا در دریافت اعضا.')});return()=>{active=false};},[]);return <div className="page container"><SectionTitle kicker="Community" title="همه اعضای GrowLand" text="کارت پروفایل اعضا بر اساس اطلاعات تکمیل‌شده و وضعیت رشد نمایش داده می‌شود."/>{error&&<div className="error">{error}</div>}<div className="member-grid">{members.map(m=><MemberCard key={m.id} member={m}/>)}</div>{!members.length&&!error&&<div className="empty large">هنوز پروفایل عمومی‌ای برای نمایش وجود ندارد.</div>}</div>}
function MemberCard({member}){return <article className="member-card"><div className="member-head"><div className="avatar big">{initials(member.name)}</div><div><h3>{member.name}</h3><span>{member.primarySkill||'مسیر در حال تنظیم'}</span></div><b className="level-badge">Lv.{member.level||1}</b></div><div className="xpbar"><span style={{width:`${Math.min(100,(member.xp%1000)/10)}%`}}></span></div><div className="member-meta"><span>{member.xp||0} XP</span><span>{member.skills?.length||0} مهارت</span><span>{member.ready?'آماده کار':'در مسیر رشد'}</span></div><div className="tags">{(member.skills||[]).slice(0,4).map(s=><span key={s.name}>{s.name}</span>)}</div></article>}

function Dashboard({user}){
  const [data,setData]=useState(null);
  const [loadError,setLoadError]=useState('');
  const [report,setReport]=useState('');
  const [msg,setMsg]=useState('');
  const [profile,setProfile]=useState({name:'',phone:'',age:'',city:'',goal:'',about:''});
  const [saving,setSaving]=useState(false);
  const [reportSaving,setReportSaving]=useState(false);
  const load=useCallback(async()=>{
    setLoadError('');
    const d=await api('/member/dashboard');
    setData(d);
    const m=d.member||{};
    setProfile({name:m.name||'',phone:m.phone||'',age:m.age??'',city:m.city||'',goal:m.goal||'',about:m.about||''});
    return d;
  },[]);
  useEffect(()=>{ let active=true; load().catch(e=>{if(active)setLoadError(e.message||'خطا در دریافت پنل رشد.')}); return ()=>{active=false}; },[load]);
  if(!data&&!loadError)return <div className="page container"><div className="panel"><div className="loader"></div><p>در حال دریافت پنل رشد…</p></div></div>;
  if(!data&&loadError)return <div className="page container"><div className="panel"><div className="error">{loadError}</div><button className="btn primary" onClick={()=>load().catch(e=>setLoadError(e.message))}>تلاش دوباره</button></div></div>;
  const member=data.member||{};
  const skills=Array.isArray(member.skills)?member.skills:[];
  const isAdmin=user?.role==='admin';
  const saveProfile=async()=>{
    if(isAdmin){setMsg('پروفایل مدیر اصلی از این بخش قابل ویرایش نیست.');return;}
    if(saving)return;
    setSaving(true);setMsg('');
    try{await api('/member/profile',{method:'PUT',body:JSON.stringify(profile)});setMsg('پروفایل ذخیره شد.');await load();}
    catch(e){setMsg(e.message)}
    finally{setSaving(false)}
  };
  const sendReport=async()=>{
    const body=report.trim();
    if(!body){setMsg('متن گزارش خالی است.');return;}
    if(reportSaving)return;
    setReportSaving(true);setMsg('');
    try{await api('/member/reports',{method:'POST',body:JSON.stringify({body})});setReport('');setMsg('گزارش ارسال شد.');await load();}
    catch(e){setMsg(e.message)}
    finally{setReportSaving(false)}
  };
  return <div className="page container">
    <div className="panel wide-panel">
      <div className="panel-title"><h2>پروفایل من</h2>{isAdmin&&<span>مدیر اصلی</span>}</div>
      <div className="modal-grid">
        <Field label="نام"><input disabled={isAdmin} value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></Field>
        <Field label="شماره موبایل"><input disabled value={profile.phone}/></Field>
        <Field label="سن"><input disabled={isAdmin} value={profile.age} onChange={e=>setProfile({...profile,age:e.target.value})}/></Field>
        <Field label="شهر"><input disabled={isAdmin} value={profile.city} onChange={e=>setProfile({...profile,city:e.target.value})}/></Field>
        <Field label="هدف" wide><textarea disabled={isAdmin} value={profile.goal} onChange={e=>setProfile({...profile,goal:e.target.value})}/></Field>
        <Field label="معرفی" wide><textarea disabled={isAdmin} value={profile.about} onChange={e=>setProfile({...profile,about:e.target.value})}/></Field>
      </div>
      {!isAdmin&&<button className="btn primary" disabled={saving} onClick={saveProfile}>{saving?'در حال ذخیره…':'ذخیره پروفایل'}</button>}
      {msg&&<span>{msg}</span>}
    </div>
    <div className="dashboard-head">
      <div><span className="eyebrow">Growth Dashboard</span><h1>سلام {(user?.name||'کاربر').split(' ')[0]} 👋</h1><p>اینجا می‌توانی رشد، XP، مهارت‌ها و مسیر پیشنهادی خودت را ببینی.</p></div>
      <div className={member.ready?'ready-toggle active':'ready-toggle'} title="این وضعیت فقط از طریق ارزیابی شغلی تغییر می‌کند."><span></span>{member.jobReadiness?.status==='job_ready'?'آماده کار':member.jobReadiness?.status==='developing'?'در حال توسعه':'در مسیر رشد'}</div>
    </div>
    <div className="dashboard-grid">
      <StatCard title="Level" value={member.level||1} sub={`${member.xp||0} XP`}/><StatCard title="XP" value={member.xp||0} sub="امتیاز رشد"/><StatCard title="مهارت‌ها" value={skills.length} sub="حوزه فعال"/><StatCard title="گزارش‌ها" value={Array.isArray(data.reports)?data.reports.length:0} sub="ارسال‌شده"/>
      <div className="panel wide-panel"><div className="panel-title"><h2>رادار مهارت‌ها</h2><span>سطح فعلی</span></div><RadarChart skills={skills}/></div>
      <div className="panel"><div className="panel-title"><h2>XP مهارت‌ها</h2></div><SkillXP skills={skills}/></div>
      <div className="panel"><div className="panel-title"><h2>رشد ۷ روز اخیر</h2></div><LineChart data={Array.isArray(data.growth)?data.growth:[]}/></div>
      <div className="panel wide-panel"><div className="panel-title"><h2>Roadmap اختصاصی</h2></div><div className="roadmap-text">{member.roadmap || 'تیم GrowLand پس از بررسی مسیرت، برنامه رشد اختصاصی را اینجا قرار می‌دهد.'}</div></div>
      {!isAdmin&&<ActivityBoard activities={data.activities||[]} submissions={data.submissions||[]} onDone={()=>load().catch(e=>setMsg(e.message))}/>} 
      {!isAdmin&&<div className="panel wide-panel"><div className="panel-title"><h2>ارسال گزارش برای ادمین</h2></div><textarea className="report-box" value={report} onChange={e=>setReport(e.target.value)} placeholder="امروز چه کاری انجام دادی؟ چه خروجی یا شواهدی داری؟"></textarea><div className="report-actions"><button className="btn primary" disabled={reportSaving} onClick={sendReport}>{reportSaving?'در حال ارسال…':'ارسال گزارش'}</button>{msg&&<span>{msg}</span>}</div></div>}
    </div>
  </div>;
}
function ActivityBoard({activities,submissions,onDone}){
 const [artifact,setArtifact]=useState({}); const [saving,setSaving]=useState('');
 const submit=async activity=>{const value=String(artifact[activity.id]||'').trim();if(!value)return;setSaving(activity.id);try{await api(`/member/activities/${activity.id}/submissions`,{method:'POST',body:JSON.stringify({artifact:value})});setArtifact({...artifact,[activity.id]:''});onDone()}catch(e){alert(e.message)}finally{setSaving('')}};
 const statusFor=id=>submissions.find(s=>s.activityId===id);
 return <div className="panel wide-panel"><div className="panel-title"><h2>فعالیت‌های رشد</h2><span>یادگیری → خروجی → Proof → XP</span></div>{activities.length?activities.map(a=>{const sub=statusFor(a.id);return <div className="activity-card" key={a.id}><div><b>{a.title}</b><span>{a.skill} · {a.xp} XP · {a.difficulty}</span>{a.description&&<p>{a.description}</p>}</div>{sub?<div className="activity-status">{sub.status==='approved'?'تأیید شد':sub.status==='rejected'?'رد شد':'در انتظار بررسی'}</div>:<div className="activity-submit"><textarea value={artifact[a.id]||''} onChange={e=>setArtifact({...artifact,[a.id]:e.target.value})} placeholder="لینک، متن خروجی یا توضیح شواهد عملکرد…"/><button className="btn primary" disabled={saving===a.id} onClick={()=>submit(a)}>{saving===a.id?'در حال ارسال…':'ثبت خروجی'}</button></div>}</div>}) : <div className="empty">هنوز فعالیت فعالی تعریف نشده است.</div>}</div>
}

function StatCard({title,value,sub}){return <div className="stat-card"><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>}

function RadarChart({skills}){const vals=skills.slice(0,6);if(!vals.length)return <div className="empty">مهارتی ثبت نشده است.</div>;const n=vals.length,cx=150,cy=120,r=85,pts=vals.map((s,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]});const poly=vals.map((s,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;const rr=r*Math.min(1,(s.level||0)/5);return `${cx+Math.cos(a)*rr},${cy+Math.sin(a)*rr}`}).join(' ');return <div className="radar-wrap"><svg viewBox="0 0 300 250"><polygon points={pts.map(p=>p.join(',')).join(' ')} fill="none" stroke="currentColor" opacity=".18"/><polygon points={vals.map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return `${cx+Math.cos(a)*r*.5},${cy+Math.sin(a)*r*.5}`}).join(' ')} fill="none" stroke="currentColor" opacity=".12"/><polygon points={poly} fill="currentColor" opacity=".25" stroke="currentColor" strokeWidth="2"/>{vals.map((s,i)=>{const [x,y]=pts[i];return <g key={s.name}><circle cx={x} cy={y} r="3" fill="currentColor"/><text x={x} y={y+(y<cy?-8:16)} textAnchor="middle" fontSize="9">{s.name.slice(0,12)}</text></g>})}</svg></div>}
function SkillXP({skills}){return <div className="skill-list">{skills.map(s=><div className="skill-line" key={s.name}><div><span>{s.name}</span><b>{s.xp||0} XP</b></div><div className="xpbar"><span style={{width:`${Math.min(100,((s.xp||0)%1000)/10)}%`}}/></div></div>)}</div>}
function LineChart({data=[]}){const vals=data.map(x=>x.xp||0);const max=Math.max(...vals,1),min=Math.min(...vals,0);const points=vals.map((v,i)=>`${10+i*(180/Math.max(vals.length-1,1))},${100-((v-min)/(max-min||1))*80}`).join(' ');return <div className="line-wrap"><svg viewBox="0 0 200 120"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{data.map((x,i)=><text key={i} x={10+i*(180/Math.max(data.length-1,1))} y="115" textAnchor="middle" fontSize="7">{x.label}</text>)}</svg></div>}

function Admin({user}){const [data,setData]=useState(null);const [selected,setSelected]=useState(null);const [tab,setTab]=useState('members');const [notice,setNotice]=useState('');const [loading,setLoading]=useState(true);const load=useCallback(async()=>{setLoading(true);setNotice('');try{const result=await api('/admin/overview');setData(result);return result}catch(e){setNotice(e.message||'خطا در دریافت اطلاعات پنل ادمین.');throw e}finally{setLoading(false)}},[]);useEffect(()=>{load().catch(()=>{})},[load]);if(loading&&!data)return <div className="page container"><div className="panel"><div className="loader"></div><p>در حال دریافت اطلاعات پنل ادمین…</p></div></div>;if(!data)return <div className="page container"><div className="panel"><div className="error">{notice||'دریافت اطلاعات پنل ادمین ناموفق بود.'}</div><button className="btn primary" onClick={()=>load().catch(()=>{})}>تلاش دوباره</button></div></div>;return <div className="page container"><div className="admin-head"><div><span className="eyebrow">Admin System</span><h1>پنل مدیریت GrowLand</h1><p>همه ادمین‌ها از یک پنل واحد برای اعتبارسنجی رشد و مدیریت اعضا استفاده می‌کنند.</p></div><div className="admin-pill">مدیر: {user.name}</div></div><div className="admin-tabs"><button className={tab==='members'?'active':''} onClick={()=>setTab('members')}>اعضا</button><button className={tab==='reports'?'active':''} onClick={()=>setTab('reports')}>گزارش‌ها <b>{data.reports?.length||0}</b></button><button className={tab==='activities'?'active':''} onClick={()=>setTab('activities')}>فعالیت‌ها</button><button className={tab==='admins'?'active':''} onClick={()=>setTab('admins')}>ادمین‌ها</button></div>{tab==='members'&&<AdminMembers members={data.members||[]} onSelect={setSelected}/>} {tab==='reports'&&<Reports reports={data.reports||[]}/>} {tab==='activities'&&<AdminActivities activities={data.activities||[]} submissions={data.pendingSubmissions||[]} members={data.members||[]} onDone={()=>load().catch(()=>{})}/>} {tab==='admins'&&<AdminManagers members={data.members||[]} onDone={()=>{load();setNotice('تغییرات ذخیره شد.')}}/>}{selected&&<AdminMemberModal member={selected} onClose={()=>setSelected(null)} onDone={()=>{setSelected(null);load();setNotice('پروفایل عضو به‌روزرسانی شد.')}}/>}{notice&&<div className="toast" onClick={()=>setNotice('')}>{notice}</div>}</div>}
function AdminMembers({members,onSelect}){return <div className="admin-members">{members.map(m=><button key={m.id} className="admin-member-row" onClick={()=>onSelect(m)}><div className="avatar">{initials(m.name)}</div><div><b>{m.name}</b><span>{m.phone} · {m.primarySkill}</span></div><div className="admin-row-right"><b>Lv.{m.level}</b><span>{m.xp} XP</span></div></button>)}{!members.length&&<div className="empty large">هنوز عضوی ثبت نشده است.</div>}</div>}
function Reports({reports}){return <div className="reports-list">{reports.map(r=><article className="report-card" key={r.id}><div><b>{r.memberName}</b><span>{new Date(r.createdAt).toLocaleString('fa-IR')}</span></div><p>{r.body}</p></article>)}{!reports.length&&<div className="empty large">گزارشی برای بررسی وجود ندارد.</div>}</div>}
function AdminActivities({activities,submissions,members,onDone}){const [form,setForm]=useState({title:'',skill:'',difficulty:'simple',xp:100,description:''});const [saving,setSaving]=useState(false);const create=async()=>{if(saving)return;setSaving(true);try{await api('/admin/activities',{method:'POST',body:JSON.stringify(form)});setForm({title:'',skill:'',difficulty:'simple',xp:100,description:''});onDone()}catch(e){alert(e.message)}finally{setSaving(false)}};const review=async(id,status)=>{try{await api(`/admin/submissions/${id}`,{method:'PATCH',body:JSON.stringify({status})});onDone()}catch(e){alert(e.message)}};return <div className="admin-managers"><div className="promote-box"><h3>ساخت فعالیت جدید</h3><div className="modal-grid"><Field label="عنوان"><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field><Field label="مهارت"><input value={form.skill} onChange={e=>setForm({...form,skill:e.target.value})}/></Field><Field label="XP"><input type="number" min="1" max="1000" value={form.xp} onChange={e=>setForm({...form,xp:e.target.value})}/></Field><Field label="سطح"><select value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}><option value="simple">ساده</option><option value="medium">متوسط</option><option value="hard">سخت</option></select></Field><Field label="توضیح" wide><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Field></div><button className="btn primary" disabled={saving} onClick={create}>{saving?'در حال ذخیره…':'ساخت فعالیت'}</button></div><div className="reports-list"><h3>خروجی‌های در انتظار بررسی</h3>{submissions.length?submissions.map(s=>{const member=members.find(m=>m.id===s.memberId);const activity=activities.find(a=>a.id===s.activityId);return <article className="report-card" key={s.id}><div><b>{member?.name||'عضو'}</b><span>{activity?.title||'فعالیت'}</span></div><p>{s.artifact}</p><div className="report-actions"><button className="btn primary" onClick={()=>review(s.id,'approved')}>تأیید و اعطای XP</button><button className="btn danger" onClick={()=>review(s.id,'rejected')}>رد</button></div></article>}) : <div className="empty">خروجی در انتظار بررسی وجود ندارد.</div>}</div></div>}

function AdminManagers({members,onDone}){const [phone,setPhone]=useState('');const promote=async()=>{try{await api('/admin/role',{method:'PATCH',body:JSON.stringify({phone,role:'admin'})});setPhone('');onDone()}catch(e){alert(e.message)}};const demote=async id=>{try{await api(`/admin/members/${id}/role`,{method:'PATCH',body:JSON.stringify({role:'member'})});onDone()}catch(e){alert(e.message)}};return <div className="admin-managers"><div className="promote-box"><h3>ارتقای عضو به ادمین</h3><div className="inline-form"><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+989..."/><button className="btn primary" onClick={promote}>ارتقا</button></div></div><div className="admin-list">{members.filter(m=>m.role==='admin').map(m=><div className="admin-item" key={m.id}><div><b>{m.name}</b><span>{m.phone}</span></div><button className="btn danger" onClick={()=>demote(m.id)}>عزل ادمین</button></div>)}</div></div>}
function AdminMemberModal({member,onClose,onDone}){const [xp,setXp]=useState(member.xp);const [skill,setSkill]=useState('');const [roadmap,setRoadmap]=useState(member.roadmap||'');const [status,setStatus]=useState(member.jobReadiness?.status||'not_ready');const [score,setScore]=useState(0);const [role,setRole]=useState('');const [notes,setNotes]=useState('');const save=async()=>{try{await api(`/admin/members/${member.id}`,{method:'PATCH',body:JSON.stringify({xp:Number(xp),roadmap})});if(skill.trim()){await api(`/admin/members/${member.id}/skills`,{method:'POST',body:JSON.stringify({name:skill.trim(),xp:0,level:1})});}onDone()}catch(e){alert(e.message)}};const removeSkill=async(name)=>{try{await api(`/admin/members/${member.id}/skills`,{method:'DELETE',body:JSON.stringify({name})});onDone()}catch(e){alert(e.message)}};const deleteMember=async()=>{if(!confirm('آیا از حذف این عضو مطمئن هستید؟'))return;try{await api(`/admin/members/${member.id}`,{method:'DELETE'});onDone()}catch(e){alert(e.message)}};return <div className="modal-backdrop"><div className="modal"><button className="modal-close" onClick={onClose}>×</button><div className="member-head"><div className="avatar big">{initials(member.name)}</div><div><h2>{member.name}</h2><span>{member.phone}</span></div></div><div className="modal-grid"><Field label="XP"><input type="number" min="0" value={xp} onChange={e=>setXp(e.target.value)}/></Field><Field label="افزودن مهارت"><input value={skill} onChange={e=>setSkill(e.target.value)} placeholder="نام مهارت جدید"/></Field><Field label="Roadmap" wide><textarea value={roadmap} onChange={e=>setRoadmap(e.target.value)}/></Field></div><div className="panel"><div className="panel-title"><h3>ارزیابی شغلی</h3></div><div className="modal-grid"><Field label="وضعیت"><select value={status} onChange={e=>setStatus(e.target.value)}><option value="not_ready">آماده نیست</option><option value="developing">در حال توسعه</option><option value="job_ready">آماده کار</option></select></Field><Field label="امتیاز"><input type="number" min="0" max="100" value={score} onChange={e=>setScore(e.target.value)}/></Field><Field label="نقش هدف"><input value={role} onChange={e=>setRole(e.target.value)}/></Field><Field label="یادداشت" wide><textarea value={notes} onChange={e=>setNotes(e.target.value)}/></Field></div><button className="btn ghost full" onClick={async()=>{try{await api('/admin/assessments',{method:'POST',body:JSON.stringify({memberId:member.id,status,score:Number(score),role,notes})});onDone()}catch(e){alert(e.message)}}}>ثبت ارزیابی</button></div><div className="tags admin-tags">{(member.skills||[]).map(s=><button key={s.name} onClick={()=>removeSkill(s.name)}>{s.name} ×</button>)}</div><button className="btn danger full" onClick={deleteMember}>حذف عضو</button><button className="btn primary full" onClick={save}>ذخیره تغییرات</button></div></div>}

function Footer(){return <footer><div className="container footer-inner"><div><b>GrowLand</b><p>رشد → اثبات → توانمندی → فرصت</p></div><span>© {new Date().getFullYear()} GrowLand</span></div></footer>}

createRoot(document.getElementById('root')).render(<ErrorBoundary><BrowserRouter><App/></BrowserRouter></ErrorBoundary>);
