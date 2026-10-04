import React, { Component, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './styles.css';

const API = String(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const DEFAULT_SKILLS = ['طراحی','برنامه‌نویسی','تولید محتوا','فروش و مذاکره','مهارت‌های فردی','کسب‌وکار','نویسندگی','زبان'];
let publicMembersRequest = null;

function getPublicMembers(){
  if(!publicMembersRequest) publicMembersRequest = api('/public/members').finally(()=>{ publicMembersRequest = null; });
  return publicMembersRequest;
}

async function api(path, options={}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout ?? 15000);
  try {
    const { timeout: _timeout, headers: customHeaders, ...requestOptions } = options;
    const headers = { 'Content-Type': 'application/json', ...(customHeaders || {}) };
    const res = await fetch(`${API}${path}`, { ...requestOptions, headers, credentials:'include', signal:controller.signal });
    const data = await res.json().catch(()=>({}));
    if(!res.ok){
      if(res.status === 401) window.dispatchEvent(new CustomEvent('growland:auth-expired'));
      throw new Error(data.message || `خطای سرور (${res.status})`);
    }
    return data;
  } catch(error){
    if(error?.name === 'AbortError') throw new Error('درخواست بیش از حد طول کشید. دوباره تلاش کنید.');
    throw error;
  } finally { clearTimeout(timeout); }
}

function notify(message,type='error'){ window.dispatchEvent(new CustomEvent('growland:toast',{detail:{message,type}})); }

function useAuth(){
  const [auth,setAuth] = useState({loading:true,user:null});
  const refresh = useCallback(async()=>{
    try { const data=await api('/auth/me'); setAuth({loading:false,user:data.user}); return data.user; }
    catch { setAuth({loading:false,user:null}); return null; }
  },[]);
  useEffect(()=>{
    refresh();
    const onExpired=()=>setAuth({loading:false,user:null});
    const onProfileUpdated=(event)=>{ if(event.detail) setAuth(current=>({...current,user:event.detail})); };
    window.addEventListener('growland:auth-expired',onExpired);
    window.addEventListener('growland:profile-updated',onProfileUpdated);
    return ()=>{
      window.removeEventListener('growland:auth-expired',onExpired);
      window.removeEventListener('growland:profile-updated',onProfileUpdated);
    };
  },[refresh]);
  return {...auth,refresh};
}

class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state={hasError:false}; }
  static getDerivedStateFromError(){ return {hasError:true}; }
  componentDidCatch(error,info){ console.error('GROWLAND_REACT_ERROR',error,info); }
  render(){ return this.state.hasError ? <main className="error-page"><div className="surface error-surface"><span className="status-dot danger-dot"/>یک خطای غیرمنتظره رخ داد. صفحه را تازه‌سازی کنید.</div></main> : this.props.children; }
}

function Icon({name,size=20,stroke=1.7}){
  const props={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:stroke,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true,focusable:'false'};
  const paths={
    arrow:<><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></>,
    chevron:<path d="m8 10 4 4 4-4"/>, menu:<><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
    x:<><path d="m7 7 10 10"/><path d="M17 7 7 17"/></>, check:<path d="m5 12 4 4L19 6"/>, plus:<><path d="M12 5v14"/><path d="M5 12h14"/></>,
    users:<><circle cx="9" cy="8" r="3"/><path d="M3 20c.5-3.3 2.4-5 6-5s5.5 1.7 6 5"/><path d="M16 5.5c2.5.2 4 1.7 4 4.2"/><path d="M16 14.8c2.4.1 4.1 1.5 4.7 4.2"/></>,
    spark:<><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
    target:<><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></>,
    chart:<><path d="M4 19V5M4 19h16"/><path d="m7 15 3-4 3 2 4-6"/></>,
    grid:<><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    user:<><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.4 3.2-5.1 7-5.1s6.2 1.7 7 5.1"/></>, lock:<><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    phone:<path d="M7 4h3l1.3 4-2 1.4a14.5 14.5 0 0 0 5.3 5.3L16 12.7l4 1.3v3a2 2 0 0 1-2.2 2C10.7 18.2 5.8 13.3 4.1 6.2A2 2 0 0 1 6 4h1Z"/>,
    pin:<><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></>, flag:<path d="M6 21V4m0 1c4-2 7 2 12 0v8c-5 2-8-2-12 0"/>,
    book:<><path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z"/><path d="M7 4v14M5 18c0 1.1.9 2 2 2h12"/></>,
    brief:<><rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V5h6v2M4 12h16"/></>, shield:<><path d="M12 3 20 6v5c0 5.1-3.1 8.4-8 10-4.9-1.6-8-4.9-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    clock:<><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></>, logout:<><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/><path d="m14 8 4 4-4 4M9 12h9"/></>,
    edit:<><path d="m4 16 9.5-9.5 4 4L8 20H4v-4Z"/><path d="m13 7 2 2"/></>, bell:<><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    database:<><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/><path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/></>,
    trash:<><path d="M5 7h14M10 11v5M14 11v5M8 7l1 13h6l1-13M9 4h6l1 3H8l1-3Z"/></>, closeCircle:<><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></>,
    external:<><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/></>,
    refresh:<><path d="M20 11a8 8 0 0 0-14-4L4 9M4 5v4h4"/><path d="M4 13a8 8 0 0 0 14 4l2-2M20 19v-4h-4"/></>
  };
  return <svg {...props}>{paths[name]||paths.spark}</svg>;
}

function Logo({withWord=true}){
  return <Link to="/" className="brand-lockup"><span className="logo-mark" aria-label="نشان گرولند"><img src="/growland-logo.webp" alt="نشان کامل GrowLand"/></span>{withWord&&<span className="brand-word"><strong>Grow</strong><b>Land</b><small>رشد در کنار هم · فراتر رفتن</small></span>}</Link>;
}

function App(){
  const auth=useAuth();
  if(auth.loading) return <div className="boot-screen"><div className="boot-orbit"><img src="/growland-logo.webp" alt="GrowLand"/></div><div><b>GrowLand</b><span>در حال راه‌اندازی فضای رشد…</span></div></div>;
  return <Routes><Route path="*" element={<Site auth={auth}/>}/></Routes>;
}

function Site({auth}){
  const [toast,setToast]=useState(null);
  useEffect(()=>{ const onToast=e=>{setToast(e.detail); window.clearTimeout(window.__growlandToast); window.__growlandToast=window.setTimeout(()=>setToast(null),4200)}; window.addEventListener('growland:toast',onToast); return()=>window.removeEventListener('growland:toast',onToast); },[]);
  return <div className="site-frame">
    <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
    <Navbar user={auth.user}/>
    <main id="main-content"><Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/signup" element={<Signup onAuth={auth.refresh}/>}/>
      <Route path="/signin" element={<Signin onAuth={auth.refresh}/>}/>
      <Route path="/members" element={<Members/>}/>
      <Route path="/dashboard" element={auth.user?<Dashboard user={auth.user}/>:<Navigate to="/signin" replace/>}/>
      <Route path="/admin" element={auth.user?.role==='admin'?<Admin user={auth.user}/>:<Navigate to="/signin" replace/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes></main>
    <Footer/>
    {toast&&<div className={`toast global-toast ${toast.type==='success'?'toast-success':''}`} role="status" onClick={()=>setToast(null)}>{toast.message}</div>}
  </div>;
}

function Navbar({user}){
  const [open,setOpen]=useState(false);
  const location=useLocation();
  useEffect(()=>setOpen(false),[location.pathname,location.hash]);
  const logout=async()=>{try{await api('/auth/logout',{method:'POST'});}finally{window.location.href='/signin';}};
  return <header className="site-nav">
    <div className="nav-wrap">
      <Logo/>
      <nav id="primary-navigation" className={open?'main-nav is-open':'main-nav'}>
        <a href="/#about">درباره گرولند</a><a href="/#journey">مسیر رشد</a><NavLink to="/members">اعضای جامعه</NavLink>
        {user?<NavLink to="/dashboard">فضای رشد من</NavLink>:<NavLink to="/signin">ورود</NavLink>}
        {user?.role==='admin'&&<NavLink to="/admin">مدیریت</NavLink>}
        {!user&&<NavLink to="/signup" className="nav-primary">شروع عضویت <Icon name="arrow" size={16}/></NavLink>}
        {user&&<button className="nav-logout" onClick={logout}><Icon name="logout" size={16}/> خروج</button>}
      </nav>
      <div className="nav-end">
        {user?<Link className="mini-profile" to="/dashboard"><span className="avatar tiny">{initials(user.name)}</span><span>{user.name?.split(' ')[0]}</span></Link>:<Link className="nav-mini-cta" to="/signup">عضویت</Link>}
        <button className="menu-btn" onClick={()=>setOpen(x=>!x)} aria-label={open?'بستن منو':'باز کردن منو'} aria-expanded={open} aria-controls="primary-navigation"><Icon name={open?'x':'menu'} size={22}/></button>
      </div>
    </div>
  </header>;
}

function Home(){
  const [members,setMembers]=useState([]);
  const [announcements,setAnnouncements]=useState([]);
  const [membersState,setMembersState]=useState('loading');
  const [announcementsState,setAnnouncementsState]=useState('loading');
  const [membersError,setMembersError]=useState('');
  const [announcementsError,setAnnouncementsError]=useState('');
  const load=useCallback(()=>{
    setMembersState('loading'); setAnnouncementsState('loading'); setMembersError(''); setAnnouncementsError('');
    getPublicMembers().then(d=>{setMembers(d.members||[]);setMembersState('success')}).catch(e=>{setMembersState('error');setMembersError(e.message||'دریافت اعضا انجام نشد.')});
    api('/public/announcements').then(d=>{setAnnouncements(d.announcements||[]);setAnnouncementsState('success')}).catch(e=>{setAnnouncementsState('error');setAnnouncementsError(e.message||'دریافت اطلاعیه‌ها انجام نشد.')});
  },[]);
  useEffect(()=>{load()},[load]);
  const top=members.slice(0,3);
  return <>
    <section className="hero-home" id="about">
      <div className="hero-noise"/>
      <div className="hero-grid-graphic graphic-one"/><div className="hero-grid-graphic graphic-two"/>
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="pill accent-pill"><i/> سیستم رشد واقعی</span>
          <h1>رشد، وقتی واقعی می‌شود که <em>قابل اثبات</em> باشد.</h1>
          <p>GrowLand یک فضای زنده برای تبدیل یادگیری به خروجی، خروجی به شواهد و شواهد به توانمندی شغلی است.</p>
          <div className="hero-actions"><Link className="button button-main" to="/signup">شروع مسیر <Icon name="arrow" size={18}/></Link><a className="button button-ghost" href="#journey">ببین چطور کار می‌کند <Icon name="chevron" size={17}/></a></div>
          <div className="hero-points"><span><i><Icon name="check" size={13}/></i> بدون امتیازِ صوری</span><span><i><Icon name="check" size={13}/></i> مبتنی بر خروجی واقعی</span><span><i><Icon name="check" size={13}/></i> مسیر شغلی مرحله‌به‌مرحله</span></div>
        </div>
        <div className="hero-visual brand-hero-visual" aria-label="لوگوی متحرک گرولند">
          <div className="brand-orbit brand-orbit-outer" aria-hidden="true"/>
          <div className="brand-orbit brand-orbit-middle" aria-hidden="true"/>
          <div className="brand-orbit brand-orbit-inner" aria-hidden="true"/>
          <div className="brand-halo brand-halo-one" aria-hidden="true"/>
          <div className="brand-halo brand-halo-two" aria-hidden="true"/>
          <span className="brand-orbit-point brand-orbit-point-a" aria-hidden="true"/>
          <span className="brand-orbit-point brand-orbit-point-b" aria-hidden="true"/>
          <span className="brand-orbit-point brand-orbit-point-c" aria-hidden="true"/>
          <div className="brand-logo-aura" aria-hidden="true"/>
          <div className="brand-logo-frame">
            <img src="/growland-logo.webp" alt="لوگوی گرولند" fetchPriority="high" />
          </div>
        </div>
      </div>
      <div className="hero-bottom"><div className="hero-bottom-track"><span>رشد</span><i/><span>شواهد</span><i/><span>توانمندی</span><i/><span>فرصت</span></div></div>
    </section>

    <section className="section-shell manifesto-section">
      <div className="container manifesto-grid">
        <div className="manifesto-copy"><SectionTitle kicker="۰۱ / فلسفه" title="اینجا یک سایت آموزشی معمولی نیست." text="عضویت در GrowLand به معنی جمع‌کردن محتوا و مدرک نیست؛ یعنی ساختن یک سابقه قابل مشاهده از چیزی که بلد شده‌ای و واقعاً انجام داده‌ای."/><Link className="text-link" to="/signup">مسیر خودم را بساز <Icon name="arrow" size={16}/></Link></div>
        <div className="principle-list">
          <Principle index="01" icon="target" title="تمرکز" text="هر عضو یک مسیر مشخص و قابل پیگیری دارد."/>
          <Principle index="02" icon="spark" title="عمل" text="یادگیری با فعالیت و خروجی قابل بررسی همراه می‌شود."/>
          <Principle index="03" icon="shield" title="اثبات" text="رشد با شواهد، XP، سطح و ارزیابی قابل مشاهده است."/>
        </div>
      </div>
    </section>

    <section className="section-shell path-section" id="journey">
      <div className="container">
        <div className="section-topline"><SectionTitle kicker="۰۲ / سیستم رشد" title="فرمول GrowLand برای تبدیل رشد به فرصت" text="ده ایستگاه، یک جریان پیوسته؛ بدون پرش از یادگیری به ادعای حرفه‌ای بودن."/><div className="system-badge"><span>10</span><small>مرحله</small></div></div>
        <JourneyTimeline/>
      </div>
    </section>

    <section className="section-shell dark-showcase">
      <div className="container">
        <div className="showcase-head"><div><span className="eyebrow-light">۰۳ / جامعه اعضا</span><h2>آدم‌ها را با <em>رشدشان</em> ببین.</h2><p>پروفایل عمومی اعضا، سطح، XP و مهارت‌ها را به جای یک نام خالی به نمایش می‌گذارد.</p></div><Link to="/members" className="button button-ghost light">دیدن جامعه <Icon name="arrow" size={17}/></Link></div>
        <div className="ranking-stage">
          <div className="stage-line stage-line-left"/><div className="stage-line stage-line-right"/>
          {top.map((m,i)=><PodiumCard key={m.id} member={m} index={i}/>) }
          {membersState==='loading'&&<div className="stage-empty loading-state"><span className="loading-ring"/>در حال دریافت اعضا…</div>}
          {membersState==='error'&&<div className="stage-empty error-inline"><strong>نمایش جامعه موقتاً در دسترس نیست.</strong><span>{membersError}</span><button className="button button-outline" onClick={load}>تلاش دوباره</button></div>}
          {membersState==='success'&&!top.length&&<div className="stage-empty">هنوز عضوی برای نمایش در این بخش ثبت نشده است.</div>}
        </div>
      </div>
    </section>

    <section className="section-shell skills-section">
      <div className="container"><SectionTitle kicker="۰۴ / حوزه‌های مهارتی" title="زمینه رشدت را انتخاب کن" text="از یک مهارت شروع کن و آن را به خروجی، شواهد و تجربه قابل ارائه تبدیل کن."/><div className="skill-field-grid">{DEFAULT_SKILLS.map((skill,i)=><SkillTile key={skill} skill={skill} index={i}/>)}</div></div>
    </section>

    <section className="section-shell notice-section">
      <div className="container notice-layout"><div className="notice-intro"><span className="eyebrow">۰۵ / تازه‌ها</span><h2>اتفاق‌های تازه</h2><p>هر چیزی که در ساختن یک مسیر رشد واقعی باید بدانی، اینجا می‌آید.</p><Link to="/signup" className="text-link">عضو شو و وارد جریان شو <Icon name="arrow" size={16}/></Link></div><div className="notice-feed">{(announcements.length?announcements:[{title:'به GrowLand خوش آمدید',body:'اینجا رشد از یک مفهوم مبهم به یک مسیر قابل مشاهده و قابل اندازه‌گیری تبدیل می‌شود.'},{title:'XP برای عمل است',body:'فعالیت واقعی، خروجی قابل بررسی و شواهد عملکردی موتور امتیازدهی‌اند.'}]).slice(0,3).map((item,i)=><article className="notice-card" key={item.id||i}><div className="notice-no">0{i+1}</div><div><div className="notice-meta"><span>اطلاعیه</span><i/></div><h3>{item.title}</h3><p>{item.body}</p></div><Icon name="arrow" size={18}/></article>)}</div></div>
    </section>

    <section className="cta-band"><div className="container cta-band-inner"><div><span>گرولند / شروع</span><h2>از جایی شروع کن که <em>قابل اندازه‌گیری</em> باشد.</h2></div><Link className="button button-main" to="/signup">شروع عضویت <Icon name="arrow" size={18}/></Link></div></section>
  </>;
}

function SectionTitle({kicker,title,text}){ return <div className="section-title"><span className="eyebrow">{kicker}</span><h2>{title}</h2>{text&&<p>{text}</p>}</div>; }
function Principle({index,icon,title,text}){ return <article className="principle-item"><span className="principle-index">{index}</span><div className="principle-icon"><Icon name={icon} size={20}/></div><div><h3>{title}</h3><p>{text}</p></div></article>; }
function SkillTile({skill,index}){ return <div className="skill-tile"><span>{String(index+1).padStart(2,'0')}</span><Icon name={['chart','grid','spark','target','users','brief','book','flag'][index%8]} size={22}/><div><b>{skill}</b><small>مسیر رشد تخصصی</small></div><Icon name="arrow" size={17}/></div>; }
function JourneyTimeline(){ const steps=['ورود','رشد','مهارت','خروجی','شواهد','سطح','رقابت','ارزیابی','آماده‌کار','درآمد']; return <div className="journey-timeline">{steps.map((step,i)=><div className="journey-node" key={step}><span>{String(i+1).padStart(2,'0')}</span><div><b>{step}</b><small>{i<4?'ساخت پایه':i<7?'تثبیت توانمندی': 'تبدیل به فرصت'}</small></div>{i<steps.length-1&&<i/>}</div>)}</div>; }
function PodiumCard({member,index}){ return <article className={index===0?'podium-card winner':'podium-card'}><div className="podium-rank">{index===0?'01':index===1?'02':'03'}</div><div className="avatar podium-avatar">{initials(member.name)}</div><div className="podium-info"><h3>{member.name}</h3><span>{member.primarySkill||'مسیر در حال تنظیم'}</span></div><div className="podium-bottom"><strong>سطح {member.level||1}</strong><span>{member.xp||0} XP</span></div></article>; }

function Signup({onAuth}){
  const [form,setForm]=useState({name:'',age:'',phone:'',password:'',city:'',focus:'',level:'تازه شروع کردم',goal:'',hours:'۳ تا ۵ ساعت',future:'',why:'',about:''});
  const [msg,setMsg]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const nav=useNavigate();
  const update=(key)=>(e)=>setForm(current=>({...current,[key]:e.target.value}));
  const submit=async e=>{
    e.preventDefault();
    if(submitting)return;
    setSubmitting(true); setMsg('');
    try{
      await api('/auth/register',{method:'POST',body:JSON.stringify(form)});
      await onAuth();
      nav('/dashboard');
    }catch(err){ setMsg(err.message || 'ثبت‌نام انجام نشد.'); }
    finally{ setSubmitting(false); }
  };
  return <div className="signup-page">
    <div className="signup-shell">
      <aside className="signup-intro">
        <div className="signup-intro-top">
          <span className="pill accent-pill"><i/> عضویت در گرولند</span>
          <span className="signup-step-count">۰۱ / شروع مسیر</span>
        </div>
        <h1>پروفایل GrowLand<br/><em>مسیرت را می‌سازد.</em></h1>
        <p>اینجا فقط یک فرم ثبت‌نام پر نمی‌کنی؛ اطلاعاتی می‌دهی که کمک می‌کند مسیر رشد، مهارت و فرصتت از همان روز اول دقیق‌تر ساخته شود.</p>
        <div className="signup-benefits">
          <div><i><Icon name="target" size={15}/></i><span><b>مسیر مشخص</b><small>تمرکزت را انتخاب می‌کنی</small></span></div>
          <div><i><Icon name="chart" size={15}/></i><span><b>رشد قابل مشاهده</b><small>پیشرفتت با XP ثبت می‌شود</small></span></div>
          <div><i><Icon name="spark" size={15}/></i><span><b>خروجی واقعی</b><small>عمل و شواهد اهمیت دارند</small></span></div>
          <div><i><Icon name="brief" size={15}/></i><span><b>نزدیک‌تر به فرصت</b><small>مهارتت را به بازار وصل کن</small></span></div>
        </div>
        <div className="signup-quote"><span>Grow together. Go further.</span><b>رشدت را فقط نگو؛ نشانش بده.</b></div>
      </aside>

      <section className="signup-form-area">
        <div className="signup-form-head">
          <div><span className="eyebrow">ثبت‌نام جدید</span><h2>حساب رشدت را بساز.</h2><p>اطلاعات را دقیق و واقعی وارد کن؛ بعداً می‌توانی پروفایلت را تکمیل و به‌روزرسانی کنی.</p></div>
          <div className="signup-progress"><span>شروع</span><i><b/></i><span>مسیر رشد</span></div>
        </div>

        <form onSubmit={submit} className="signup-form">
          <FormSection title="اطلاعات پایه" note="01">
            <div className="fields-2">
              <Field label="نام و نام خانوادگی"><input required name="name" autoComplete="name" value={form.name} onChange={update('name')} placeholder="مثلاً آشوکا احمدی"/></Field>
              <Field label="شماره تماس"><input required name="phone" autoComplete="tel" inputMode="tel" type="tel" value={form.phone} onChange={update('phone')} placeholder="+989123456789"/></Field>
              <Field label="سن"><input required name="age" inputMode="numeric" type="number" min="5" max="120" value={form.age} onChange={update('age')} placeholder="مثلاً ۲۳"/></Field>
              <Field label="شهر"><input required name="city" autoComplete="address-level2" value={form.city} onChange={update('city')} placeholder="مثلاً تهران"/></Field>
              <Field label="رمز عبور"><input required name="password" autoComplete="new-password" minLength="8" type="password" value={form.password} onChange={update('password')} placeholder="حداقل ۸ کاراکتر"/></Field>
            </div>
          </FormSection>

          <FormSection title="مسیر فعلی" note="02">
            <div className="fields-2">
              <Field label="حوزه تمرکز"><select required value={form.focus} onChange={update('focus')}><option value="">انتخاب حوزه</option>{DEFAULT_SKILLS.map(x=><option key={x}>{x}</option>)}<option>سایر</option></select></Field>
              <Field label="سطح فعلی"><select value={form.level} onChange={update('level')}>{['تازه شروع کردم','مقدماتی','متوسط','خوب','حرفه‌ای'].map(x=><option key={x}>{x}</option>)}</select></Field>
              <Field label="هدف اصلی"><select required value={form.goal} onChange={update('goal')}><option value="">انتخاب هدف</option>{['توسعه یک مهارت','ساختن رزومه و نمونه‌کار','افزایش اعتمادبه‌نفس و مهارت‌های فردی','آماده شدن برای ورود به بازار کار','پیدا کردن مسیر شغلی','رسیدن به درآمد','سایر'].map(x=><option key={x}>{x}</option>)}</select></Field>
              <Field label="زمان هفتگی"><select value={form.hours} onChange={update('hours')}>{['کمتر از ۳ ساعت','۳ تا ۵ ساعت','۵ تا ۱۰ ساعت','بیشتر از ۱۰ ساعت'].map(x=><option key={x}>{x}</option>)}</select></Field>
            </div>
          </FormSection>

          <FormSection title="نگاه تو به رشد" note="03">
            <div className="fields-1">
              <Field label="اگر در سه ماه آینده فقط در یک چیز پیشرفت چشمگیری داشته باشی، آن چیست؟"><textarea required value={form.future} onChange={update('future')} placeholder="یک نتیجه مشخص و قابل اندازه‌گیری بنویس…"/></Field>
              <Field label="چرا فکر می‌کنی GrowLand می‌تواند به رشدت کمک کند؟"><textarea required value={form.why} onChange={update('why')} placeholder="انتظارت از این مسیر چیست؟"/></Field>
              <Field label="یک جمله درباره خودت: من کسی هستم که…"><textarea required value={form.about} onChange={update('about')} placeholder="خودت را کوتاه و واقعی معرفی کن…"/></Field>
            </div>
          </FormSection>

          {msg&&<div className="error-box" role="alert"><Icon name="closeCircle" size={18}/><span>{msg}</span></div>}
          <div className="signup-submit-row">
            <div><strong>آماده‌ای شروع کنی؟</strong><span>بعد از ثبت‌نام، مستقیم وارد داشبورد رشد شخصی می‌شوی.</span></div>
            <button className="button button-main signup-submit" disabled={submitting}>{submitting?'در حال ساخت پروفایل…':'ساخت حساب و شروع مسیر'} <Icon name="arrow" size={17}/></button>
          </div>
        </form>
        <div className="auth-bottom signup-login-link">حساب داری؟ <Link to="/signin">وارد شو</Link></div>
      </section>
    </div>
  </div>;
}
function FormSection({title,note,children}){ return <section className="form-section"><div className="form-section-head"><span>{note}</span><div><h3>{title}</h3><small>اطلاعات مورد نیاز</small></div></div>{children}</section>; }
function Field({label,children,wide}){ const id=React.useId(); const slug=String(label).replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,40)||'field'; const control=React.cloneElement(children,{id:`${slug}-${id.replace(/:/g,'')}`}); return <label className={wide?'field wide-field':'field'} htmlFor={control.props.id}><span>{label}</span>{control}</label>; }

function Signin({onAuth}){
  const [phone,setPhone]=useState(''); const [password,setPassword]=useState(''); const [msg,setMsg]=useState(''); const [submitting,setSubmitting]=useState(false); const nav=useNavigate();
  const submit=async e=>{e.preventDefault();if(submitting)return;setSubmitting(true);setMsg('');try{await api('/auth/login',{method:'POST',body:JSON.stringify({phone,password})});await onAuth();nav('/dashboard')}catch(err){setMsg(err.message)}finally{setSubmitting(false)}};
  return <div className="auth-layout compact-auth"><div className="auth-aside"><Logo/><div className="signin-visual"><div className="signin-orbit one"/><div className="signin-orbit two"/><img src="/growland-logo.webp" alt="GrowLand"/><span>یادگیری / اجرا / رشد</span></div><div className="aside-quote">«رشدت را فقط نگو؛ نشانش بده.»</div></div><div className="auth-main signin-main"><div className="signin-card"><span className="eyebrow">ورود به حساب</span><h1>به مسیرت برگرد.</h1><p>با شماره موبایل و رمز عبورت وارد فضای رشد شخصی شو.</p><form onSubmit={submit}><Field label="شماره تماس"><input required name="phone" autoComplete="tel" inputMode="tel" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+989123456789"/></Field><Field label="رمز عبور"><input required name="password" autoComplete="current-password" minLength="8" type="password" value={password} onChange={e=>setPassword(e.target.value)}/></Field>{msg&&<div className="error-box">{msg}</div>}<button className="button button-main full-btn" disabled={submitting}>{submitting?'در حال ورود…':'ورود به فضای رشد'} <Icon name="arrow" size={17}/></button></form><div className="auth-divider"><span>یا</span></div><Link to="/signup" className="button button-outline full-btn">ساخت حساب جدید</Link></div></div></div>;
}

function Members(){
  const [members,setMembers]=useState([]); const [state,setState]=useState('loading'); const [error,setError]=useState('');
  const load=useCallback(()=>{setState('loading');setError('');getPublicMembers().then(d=>{setMembers(d.members||[]);setState('success')}).catch(e=>{setState('error');setError(e.message||'خطا در دریافت اعضا.')})},[]);
  useEffect(()=>{load()},[load]);
  return <div className="page-wrap members-page"><div className="container"><div className="page-hero"><div><span className="eyebrow">جامعه / اعضا</span><h1>جامعه‌ای که رشدش <em>قابل مشاهده</em> است.</h1><p>اعضای فعال GrowLand را بر اساس مسیر، مهارت‌ها، XP و سطح ببین.</p></div><div className="page-hero-stat"><strong>{state==='loading'?'—':members.length}</strong><span>عضو فعال</span></div></div>{state==='error'&&<div className="error-box" role="alert">{error}<button className="button button-outline" onClick={load}>تلاش دوباره</button></div>}{state==='loading'&&<div className="member-grid-modern">{[1,2,3].map(i=><div className="member-modern-card skeleton-card" key={i}/>)}</div>}{state==='success'&&<><div className="member-grid-modern">{members.map(m=><MemberCard key={m.id} member={m}/>)}</div>{!members.length&&<div className="empty-state"><strong>هنوز پروفایل عمومی‌ای برای نمایش وجود ندارد.</strong><span>به محض فعال شدن اعضا، اینجا رتبه‌بندی و مسیر رشدشان را می‌بینی.</span><Link className="button button-main" to="/signup">شروع عضویت</Link></div>}</>}</div></div>;
}
function MemberCard({member}){ const progress=Math.max(0,Math.min(100,Number(member.levelProgress ?? ((Number(member.xp)||0)%1000)/10))); return <article className="member-modern-card"><div className="member-card-top"><div className="avatar large">{initials(member.name)}</div><div className="member-id"><span>{member.primarySkill||'مسیر در حال تنظیم'}</span><h3>{member.name}</h3></div><span className="level-chip">سطح {member.level||1}</span></div><div className="member-progress"><div><span>پیشرفت تا سطح بعد</span><b>{Math.round(progress)}%</b></div><div className="progress-track"><span style={{width:`${progress}%`}}/></div></div><div className="member-card-bottom"><span>{member.xp||0} XP</span><span>{member.skills?.length||0} مهارت</span><span className={member.ready?'ready-text':''}><i/> {member.ready?'آماده کار':'در مسیر رشد'}</span></div><div className="tag-row">{(member.skills||[]).slice(0,4).map(s=><span key={s.name}>{s.name}</span>)}</div></article>; }

function Dashboard({user}){
  const [data,setData]=useState(null); const [loadError,setLoadError]=useState(''); const [report,setReport]=useState(''); const [msg,setMsg]=useState(''); const [profile,setProfile]=useState({name:'',phone:'',age:'',city:'',goal:'',about:''}); const [saving,setSaving]=useState(false); const [reportSaving,setReportSaving]=useState(false);
  const load=useCallback(async()=>{setLoadError('');const d=await api('/member/dashboard');setData(d);const m=d.member||{};setProfile({name:m.name||'',phone:m.phone||'',age:m.age??'',city:m.city||'',goal:m.goal||'',about:m.about||''});return d;},[]);
  useEffect(()=>{let active=true;load().catch(e=>{if(active)setLoadError(e.message||'خطا در دریافت پنل رشد.')});return()=>{active=false};},[load]);
  if(!data&&!loadError)return <PageLoader label="در حال بارگذاری فضای رشد…"/>;
  if(!data&&loadError)return <div className="page-wrap"><div className="container"><div className="surface state-surface"><div className="error-box">{loadError}</div><button className="button button-main" onClick={()=>load().catch(e=>setLoadError(e.message))}>تلاش دوباره <Icon name="refresh" size={16}/></button></div></div></div>;
  const member=data.member||{}; const skills=Array.isArray(member.skills)?member.skills:[]; const isAdmin=user?.role==='admin';
  const saveProfile=async()=>{if(saving)return;setSaving(true);setMsg('');try{const result=isAdmin?await api('/admin/profile',{method:'PATCH',body:JSON.stringify({name:profile.name})}):await api('/member/profile',{method:'PUT',body:JSON.stringify(profile)});if(result.user)window.dispatchEvent(new CustomEvent('growland:profile-updated',{detail:result.user}));setMsg('پروفایل ذخیره شد.');await load();}catch(e){setMsg(e.message)}finally{setSaving(false)}};
  const sendReport=async()=>{const body=report.trim();if(!body){setMsg('متن گزارش خالی است.');return;}if(reportSaving)return;setReportSaving(true);setMsg('');try{await api('/member/reports',{method:'POST',body:JSON.stringify({body})});setReport('');setMsg('گزارش ارسال شد.');await load();}catch(e){setMsg(e.message)}finally{setReportSaving(false)}};
  return <div className="dashboard-page" id="top"><div className="container">
    <DashboardHeader member={member} user={user}/>
    <div className="dashboard-layout"><DashboardSidebar user={user}/><div className="dashboard-main">
      <div className="dashboard-kpis"><StatCard title="سطح" value={member.level||1} sub={`${member.xp||0} XP`} icon="spark"/><StatCard title="XP" value={member.xp||0} sub="امتیاز رشد" icon="chart"/><StatCard title="مهارت‌ها" value={skills.length} sub="حوزه فعال" icon="grid"/><StatCard title="گزارش‌ها" value={Array.isArray(data.reports)?data.reports.length:0} sub="ارسال‌شده" icon="book"/></div>
      <section className="dash-panels profile-panel" id="profile"><div className="dash-section-head"><div><span className="eyebrow">پروفایل / ۰۱</span><h2>هویت رشد تو</h2></div>{isAdmin&&<span className="role-chip">ADMIN</span>}</div><div className="profile-editor"><div className="profile-editor-side"><div className="avatar huge">{initials(member.name)}</div><span>{member.primarySkill||'مسیر در حال تنظیم'}</span><b>سطح {member.level||1}</b></div><div className="profile-fields"><Field label="نام"><input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></Field><Field label="شماره موبایل"><input disabled value={profile.phone}/></Field><Field label="سن"><input disabled={isAdmin} value={profile.age} onChange={e=>setProfile({...profile,age:e.target.value})}/></Field><Field label="شهر"><input disabled={isAdmin} value={profile.city} onChange={e=>setProfile({...profile,city:e.target.value})}/></Field><Field label="هدف"><textarea disabled={isAdmin} value={profile.goal} onChange={e=>setProfile({...profile,goal:e.target.value})}/></Field><Field label="معرفی"><textarea disabled={isAdmin} value={profile.about} onChange={e=>setProfile({...profile,about:e.target.value})}/></Field><div className="profile-save"><button className="button button-main" disabled={saving} onClick={saveProfile}>{saving?'در حال ذخیره…':'ذخیره پروفایل'} <Icon name="check" size={16}/></button>{msg&&<span>{msg}</span>}</div></div></div></section>
      <div className="dashboard-two-col"><section className="dash-panels chart-panel"><div className="dash-section-head"><div><span className="eyebrow">رادار مهارت / ۰۲</span><h2>رادار مهارت‌ها</h2></div><span>سطح فعلی</span></div><RadarChart skills={skills}/></section><section className="dash-panels chart-panel"><div className="dash-section-head"><div><span className="eyebrow">رشد / ۰۳</span><h2>رشد هفت روزه</h2></div><span>XP</span></div><LineChart data={Array.isArray(data.growth)?data.growth:[]}/></section></div>
      <div className="dashboard-two-col"><section className="dash-panels"><div className="dash-section-head"><div><span className="eyebrow">مهارت / ۰۴</span><h2>امتیاز مهارت‌ها</h2></div></div><SkillXP skills={skills}/></section><section className="dash-panels roadmap-panel"><div className="dash-section-head"><div><span className="eyebrow">مسیر رشد / ۰۵</span><h2>رادمای اختصاصی</h2></div><Icon name="target" size={20}/></div><div className="roadmap-copy">{member.roadmap||'تیم GrowLand پس از بررسی مسیرت، برنامه رشد اختصاصی را اینجا قرار می‌دهد.'}</div></section></div>
      {!isAdmin&&<ActivityBoard activities={data.activities||[]} submissions={data.submissions||[]} onDone={()=>load().catch(e=>setMsg(e.message))}/>} 
      {!isAdmin&&<section className="dash-panels report-panel" id="report"><div className="dash-section-head"><div><span className="eyebrow">گزارش / ۰۶</span><h2>گزارش پیشرفت</h2><p>امروز چه کاری انجام دادی؟ خروجی یا شواهدت را ثبت کن.</p></div></div><textarea value={report} onChange={e=>setReport(e.target.value)} placeholder="لینک، توضیح، نتیجه کار یا هر چیزی که رشدت را نشان می‌دهد…"/><div className="report-send"><button className="button button-main" disabled={reportSaving} onClick={sendReport}>{reportSaving?'در حال ارسال…':'ارسال گزارش'} <Icon name="arrow" size={17}/></button>{msg&&<span>{msg}</span>}</div></section>}
    </div></div>
  </div></div>;
}
function DashboardHeader({member,user}){ return <div className="dashboard-head"><div><span className="eyebrow">فضای رشد شخصی</span><h1>سلام {((user?.name||'کاربر').split(' ')[0])}، وقت <em>ساختن</em> است.</h1><p>این صفحه مرکز فرمان رشد توست؛ هر هفته چند قدم جلوتر، هر ماه یک سطح بالاتر.</p></div><div className={member.jobReadiness?.status==='job_ready'?'ready-badge job-ready':member.jobReadiness?.status==='developing'?'ready-badge developing':'ready-badge'}><span className="status-dot"/><div><small>وضعیت</small><b>{member.jobReadiness?.status==='job_ready'?'آماده کار':member.jobReadiness?.status==='developing'?'در حال توسعه':'در مسیر رشد'}</b></div></div></div>; }
function DashboardSidebar({user}){ return <aside className="dashboard-side"><div className="side-label">دسترسی سریع</div><a href="#top" className="side-link active"><Icon name="grid" size={17}/> نمای کلی</a>{user?.role!=='admin'&&<a href="#activity" className="side-link"><Icon name="spark" size={17}/> فعالیت‌های رشد</a>}{user?.role!=='admin'&&<a href="#report" className="side-link"><Icon name="book" size={17}/> گزارش‌ها</a>}<a href="#profile" className="side-link"><Icon name="user" size={17}/> پروفایل</a><div className="side-spacer"/><Link to="/members" className="side-link"><Icon name="users" size={17}/> جامعه اعضا</Link>{user?.role==='admin'&&<Link to="/admin" className="side-link admin-link"><Icon name="shield" size={17}/> مرکز مدیریت</Link>}</aside>; }
function StatCard({title,value,sub,icon}){ return <article className="kpi-card"><div className="kpi-head"><span>{title}</span><i><Icon name={icon} size={18}/></i></div><strong>{value}</strong><small>{sub}</small></article>; }
function ActivityBoard({activities,submissions,onDone}){ const [artifact,setArtifact]=useState({}); const [saving,setSaving]=useState(''); const submit=async activity=>{const value=String(artifact[activity.id]||'').trim();if(!value)return;setSaving(activity.id);try{await api(`/member/activities/${activity.id}/submissions`,{method:'POST',body:JSON.stringify({artifact:value})});setArtifact({...artifact,[activity.id]:''});onDone()}catch(e){notify(e.message)}finally{setSaving('')}}; const statusFor=id=>submissions.find(s=>s.activityId===id); return <section className="dash-panels activity-panel" id="activity"><div className="dash-section-head"><div><span className="eyebrow">مأموریت‌ها / ۰۷</span><h2>فعالیت‌های رشد</h2><p>یادگیری ← خروجی ← شواهد ← XP</p></div><span className="mission-count">{activities.length} مأموریت</span></div><div className="mission-list">{activities.length?activities.map((a,i)=>{const sub=statusFor(a.id);return <article className="mission-card" key={a.id}><div className="mission-index">{String(i+1).padStart(2,'0')}</div><div className="mission-main"><div className="mission-meta"><span>{a.skill}</span><span>{a.xp} XP</span><span>{difficultyLabel(a.difficulty)}</span></div><h3>{a.title}</h3>{a.description&&<p>{a.description}</p>}{sub?<div className={sub.status==='approved'?'mission-status approved':sub.status==='rejected'?'mission-status rejected':'mission-status'}><Icon name={sub.status==='approved'?'check':sub.status==='rejected'?'closeCircle':'clock'} size={16}/>{sub.status==='approved'?'تأیید شد و XP اضافه شد':sub.status==='rejected'?'این خروجی رد شد':'خروجی در انتظار بررسی است'}</div>:<div className="mission-submit"><textarea value={artifact[a.id]||''} onChange={e=>setArtifact({...artifact,[a.id]:e.target.value})} placeholder="لینک، متن خروجی یا توضیح شواهد عملکرد…"/><button className="button button-main" disabled={saving===a.id} onClick={()=>submit(a)}>{saving===a.id?'در حال ارسال…':'ثبت خروجی'} <Icon name="arrow" size={15}/></button></div>}</div></article>}) : <div className="empty-state">هنوز فعالیت فعالی تعریف نشده است.</div>}</div></section>; }
function difficultyLabel(x){ return x==='hard'?'سخت':x==='medium'?'متوسط':'ساده'; }

function RadarChart({skills}){ const vals=skills.slice(0,6); if(!vals.length)return <div className="empty-state">مهارتی ثبت نشده است.</div>; const n=vals.length,cx=150,cy=125,r=88; const point=(rr,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]}; const outline=vals.map((_,i)=>point(r,i).join(',')).join(' '); const mid=vals.map((_,i)=>point(r*.5,i).join(',')).join(' '); const area=vals.map((s,i)=>point(r*Math.min(1,(s.level||0)/5),i).join(',')).join(' '); return <div className="radar-wrap"><svg viewBox="0 0 300 250"><polygon points={outline} fill="none" stroke="currentColor" opacity=".12"/><polygon points={mid} fill="none" stroke="currentColor" opacity=".08"/><polygon points={area} fill="rgba(116, 231, 63, .14)" stroke="currentColor" strokeWidth="2"/><line x1="150" y1="37" x2="150" y2="213" stroke="currentColor" opacity=".07"/><line x1="62" y1="125" x2="238" y2="125" stroke="currentColor" opacity=".07"/>{vals.map((s,i)=>{const [x,y]=point(r,i);return <g key={s.name}><circle cx={x} cy={y} r="3" fill="currentColor"/><text x={x} y={y+(y<125?-9:15)} textAnchor="middle">{s.name}</text></g>})}</svg></div>; }
function LineChart({data}){ const vals=Array.isArray(data)?data.slice(-7):[]; if(!vals.length)return <div className="empty-state">داده رشد هنوز ثبت نشده است.</div>; const ys=vals.map(x=>Number(x.xp)||0); const min=Math.min(...ys),max=Math.max(...ys),range=Math.max(1,max-min); const pts=ys.map((v,i)=>{const x=16+i*(208/Math.max(1,ys.length-1));const y=170-((v-min)/range)*118;return [x,y]}); const path=pts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' '); return <div className="line-chart"><svg viewBox="0 0 240 210"><defs><linearGradient id="growArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".22"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><path d={`${path} L ${pts[pts.length-1][0]} 185 L ${pts[0][0]} 185 Z`} fill="url(#growArea)"/><path d={path} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>{pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="4" fill="currentColor"/>)}</svg><div className="chart-labels">{vals.map((v,i)=><span key={i}>{v.label||`روز ${i+1}`}</span>)}</div></div>; }
function SkillXP({skills}){ if(!skills.length)return <div className="empty-state">مهارتی ثبت نشده است.</div>; const max=Math.max(1,...skills.map(s=>Number(s.xp)||0)); return <div className="skill-bars">{skills.slice(0,8).map(s=><div className="skill-bar" key={s.name}><div><span>{s.name}</span><b>{s.xp||0} XP</b></div><div className="skill-track"><span style={{width:`${Math.max(6,((Number(s.xp)||0)/max)*100)}%`}}/></div></div>)}</div>; }
function PageLoader({label}){ return <div className="page-wrap"><div className="container"><div className="state-surface"><div className="loading-ring"/><span>{label}</span></div></div></div>; }

function Admin({user}){
  const [data,setData]=useState(null); const [selected,setSelected]=useState(null); const [tab,setTab]=useState('members'); const [notice,setNotice]=useState(''); const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{setLoading(true);setNotice('');try{const result=await api('/admin/overview');setData(result);return result}catch(e){setNotice(e.message||'خطا در دریافت اطلاعات پنل ادمین.');throw e}finally{setLoading(false)}},[]);
  useEffect(()=>{load().catch(()=>{})},[load]);
  if(loading&&!data)return <PageLoader label="در حال راه‌اندازی مرکز مدیریت…"/>;
  if(!data)return <div className="page-wrap"><div className="container"><div className="state-surface"><div className="error-box">{notice||'دریافت اطلاعات پنل ادمین ناموفق بود.'}</div><button className="button button-main" onClick={()=>load().catch(()=>{})}>تلاش دوباره</button></div></div></div>;
  const counts={members:data.members?.length||0,reports:data.reports?.length||0,pending:data.pendingSubmissions?.length||0,admins:(data.members||[]).filter(m=>m.role==='admin').length};
  return <div className="admin-page"><div className="container"><div className="admin-hero"><div><span className="eyebrow">مرکز کنترل GrowLand</span><h1>مرکز فرمان <em>مدیریت</em>.</h1><p>اعتبارسنجی رشد، فعالیت‌ها، گزارش‌ها و وضعیت اعضا در یک فضای واحد.</p></div><div className="admin-user"><span className="avatar medium">{initials(user.name)}</span><div><small>مدیر فعال</small><b>{user.name}</b></div></div></div><div className="admin-kpis"><AdminMetric label="اعضا" value={counts.members} icon="users"/><AdminMetric label="گزارش‌ها" value={counts.reports} icon="book"/><AdminMetric label="در انتظار بررسی" value={counts.pending} icon="clock"/><AdminMetric label="ادمین‌ها" value={counts.admins} icon="shield"/></div><div className="admin-shell"><aside className="admin-sidebar"><span>CONTROL</span><button className={tab==='members'?'active':''} onClick={()=>setTab('members')}><Icon name="users" size={17}/> اعضا <b>{counts.members}</b></button><button className={tab==='reports'?'active':''} onClick={()=>setTab('reports')}><Icon name="book" size={17}/> گزارش‌ها <b>{counts.reports}</b></button><button className={tab==='activities'?'active':''} onClick={()=>setTab('activities')}><Icon name="spark" size={17}/> فعالیت‌ها <b>{counts.pending}</b></button><button className={tab==='admins'?'active':''} onClick={()=>setTab('admins')}><Icon name="shield" size={17}/> ادمین‌ها <b>{counts.admins}</b></button></aside><section className="admin-content">{tab==='members'&&<AdminMembers members={data.members||[]} onSelect={setSelected}/>} {tab==='reports'&&<Reports reports={data.reports||[]} onDone={()=>load().catch(()=>{})}/>} {tab==='activities'&&<AdminActivities activities={data.activities||[]} submissions={data.pendingSubmissions||[]} members={data.members||[]} onDone={()=>load().catch(()=>{})}/>} {tab==='admins'&&<AdminManagers members={data.members||[]} onDone={()=>{load();setNotice('تغییرات ذخیره شد.')}}/>}</section></div></div>{selected&&<AdminMemberModal member={selected} onClose={()=>setSelected(null)} onDone={()=>{setSelected(null);load();setNotice('پروفایل عضو به‌روزرسانی شد.')}}/>}{notice&&<div className="toast" onClick={()=>setNotice('')}>{notice}</div>}</div>;
}
function AdminMetric({label,value,icon}){ return <div className="admin-metric"><i><Icon name={icon} size={19}/></i><div><strong>{value}</strong><span>{label}</span></div></div>; }
function AdminMembers({members,onSelect}){ return <div className="admin-list-wrap"><div className="content-head"><div><span className="eyebrow">فهرست اعضا</span><h2>اعضای GrowLand</h2></div><span>{members.length} نتیجه</span></div><div className="admin-member-list">{members.map((m,i)=><button key={m.id} className="admin-member-item" onClick={()=>onSelect(m)}><span className="member-order">{String(i+1).padStart(2,'0')}</span><span className="avatar medium">{initials(m.name)}</span><div className="admin-member-copy"><strong>{m.name}</strong><span>{m.primarySkill||'مسیر در حال تنظیم'} · {m.phone}</span></div><span className="admin-member-level">سطح {m.level||1}</span><span className="admin-member-xp">{m.xp||0} XP</span><Icon name="arrow" size={17}/></button>)}{!members.length&&<div className="empty-state">هنوز عضوی ثبت نشده است.</div>}</div></div>; }
function Reports({reports,onDone}){ const [deleting,setDeleting]=useState(''); const [confirming,setConfirming]=useState(null); const remove=async id=>{if(deleting)return;setDeleting(id);try{await api(`/admin/reports/${id}`,{method:'DELETE'});onDone()}catch(e){notify(e.message)}finally{setDeleting('');setConfirming(null)}}; return <><div className="admin-list-wrap"><div className="content-head"><div><span className="eyebrow">بررسی گزارش‌ها</span><h2>گزارش‌های ارسالی</h2></div><span>{reports.length} گزارش</span></div><div className="reports-stack">{reports.map(r=><article className="admin-report-card" key={r.id}><div className="report-top"><div className="avatar small">{initials(r.memberName)}</div><div><strong>{r.memberName}</strong><span>{new Date(r.createdAt).toLocaleString('fa-IR')}</span></div><button className="icon-btn danger" disabled={deleting===r.id} onClick={()=>setConfirming(r.id)}><Icon name="trash" size={17}/></button></div><p>{r.body}</p></article>)}{!reports.length&&<div className="empty-state">گزارشی برای بررسی وجود ندارد.</div>}</div></div>{confirming&&<ConfirmDialog title="حذف گزارش" text="این گزارش از فهرست مدیریت حذف می‌شود. ادامه می‌دهی؟" onCancel={()=>setConfirming(null)} onConfirm={()=>remove(confirming)}/>}</>; }
function AdminActivities({activities,submissions,members,onDone}){ const [form,setForm]=useState({title:'',skill:'',difficulty:'simple',xp:100,description:''}); const [saving,setSaving]=useState(false); const create=async()=>{if(saving)return;setSaving(true);try{await api('/admin/activities',{method:'POST',body:JSON.stringify(form)});setForm({title:'',skill:'',difficulty:'simple',xp:100,description:''});onDone()}catch(e){notify(e.message)}finally{setSaving(false)}}; const review=async(id,status)=>{try{await api(`/admin/submissions/${id}`,{method:'PATCH',body:JSON.stringify({status})});onDone()}catch(e){notify(e.message)}}; return <div className="admin-activity-layout"><section className="admin-create"><div className="content-head"><div><span className="eyebrow">ساخت مأموریت</span><h2>فعالیت جدید</h2></div></div><div className="fields-2"><Field label="عنوان"><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field><Field label="مهارت"><input value={form.skill} onChange={e=>setForm({...form,skill:e.target.value})}/></Field><Field label="XP"><input type="number" min="1" max="1000" value={form.xp} onChange={e=>setForm({...form,xp:e.target.value})}/></Field><Field label="دشواری"><select value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}><option value="simple">ساده</option><option value="medium">متوسط</option><option value="hard">سخت</option></select></Field><Field label="توضیح"><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Field></div><button className="button button-main" disabled={saving} onClick={create}>{saving?'در حال ساخت…':'ساخت فعالیت'} <Icon name="plus" size={16}/></button></section><section className="admin-pending"><div className="content-head"><div><span className="eyebrow">شواهد در انتظار</span><h2>خروجی‌های در انتظار</h2></div><span>{submissions.length} مورد</span></div><div className="reports-stack">{submissions.map(s=>{const member=members.find(m=>m.id===s.memberId);const activity=activities.find(a=>a.id===s.activityId);return <article className="admin-report-card" key={s.id}><div className="report-top"><div className="avatar small">{initials(member?.name||'M')}</div><div><strong>{member?.name||'عضو'}</strong><span>{activity?.title||'فعالیت'}</span></div></div><p>{s.artifact}</p><div className="report-actions"><button className="button button-main" onClick={()=>review(s.id,'approved')}><Icon name="check" size={15}/> تأیید و اعطای XP</button><button className="button button-danger" onClick={()=>review(s.id,'rejected')}>رد</button></div></article>})}{!submissions.length&&<div className="empty-state">خروجی در انتظار بررسی وجود ندارد.</div>}</div></section></div>; }
function AdminManagers({members,onDone}){ const [phone,setPhone]=useState(''); const promote=async()=>{try{await api('/admin/role',{method:'PATCH',body:JSON.stringify({phone,role:'admin'})});setPhone('');onDone()}catch(e){notify(e.message)}}; const demote=async id=>{try{await api(`/admin/members/${id}/role`,{method:'PATCH',body:JSON.stringify({role:'member'})});onDone()}catch(e){notify(e.message)}}; return <div className="admin-managers-page"><section className="admin-create"><div className="content-head"><div><span className="eyebrow">کنترل دسترسی</span><h2>مدیریت ادمین‌ها</h2></div></div><p>شماره عضو را وارد کن تا دسترسی ادمین برای او فعال شود.</p><div className="inline-form"><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+989..."/><button className="button button-main" onClick={promote}>ارتقا <Icon name="shield" size={16}/></button></div></section><div className="admin-list-wrap"><div className="content-head"><div><span className="eyebrow">مدیران فعال</span><h2>ادمین‌های فعلی</h2></div></div><div className="admin-manager-list">{members.filter(m=>m.role==='admin').map(m=><div className="manager-row" key={m.id}><div className="avatar medium">{initials(m.name)}</div><div><strong>{m.name}</strong><span>{m.phone}</span></div><button className="button button-danger" onClick={()=>demote(m.id)}>عزل ادمین</button></div>)}</div></div></div>; }
function AdminMemberModal({member,onClose,onDone}){ const [xp,setXp]=useState(member.xp); const [skill,setSkill]=useState(''); const [roadmap,setRoadmap]=useState(member.roadmap||''); const [status,setStatus]=useState(member.jobReadiness?.status||'not_ready'); const [score,setScore]=useState(0); const [role,setRole]=useState(''); const [notes,setNotes]=useState(''); const [confirming,setConfirming]=useState(false); const save=async()=>{try{await api(`/admin/members/${member.id}`,{method:'PATCH',body:JSON.stringify({xp:Number(xp),roadmap})});if(skill.trim())await api(`/admin/members/${member.id}/skills`,{method:'POST',body:JSON.stringify({name:skill.trim(),xp:0,level:1})});onDone()}catch(e){notify(e.message)}}; const removeSkill=async name=>{try{await api(`/admin/members/${member.id}/skills`,{method:'DELETE',body:JSON.stringify({name})});onDone()}catch(e){notify(e.message)}}; const deleteMember=async()=>{try{await api(`/admin/members/${member.id}`,{method:'DELETE'});onDone()}catch(e){notify(e.message)}finally{setConfirming(false)}}; return <><div className="modal-backdrop"><div className="member-modal"><button className="icon-btn modal-close" onClick={onClose}><Icon name="x" size={19}/></button><div className="modal-hero"><div className="avatar huge">{initials(member.name)}</div><div><span className="eyebrow">پروفایل عضو</span><h2>{member.name}</h2><p>{member.phone}</p></div><div className="modal-stat"><small>سطح</small><strong>{member.level||1}</strong><span>{member.xp||0} XP</span></div></div><div className="fields-2"><Field label="XP"><input type="number" min="0" value={xp} onChange={e=>setXp(e.target.value)}/></Field><Field label="افزودن مهارت"><input value={skill} onChange={e=>setSkill(e.target.value)} placeholder="نام مهارت جدید"/></Field><Field label="مسیر رشد"><textarea value={roadmap} onChange={e=>setRoadmap(e.target.value)}/></Field><Field label="وضعیت ارزیابی"><select value={status} onChange={e=>setStatus(e.target.value)}><option value="not_ready">آماده نیست</option><option value="developing">در حال توسعه</option><option value="job_ready">آماده کار</option></select></Field><Field label="امتیاز"><input type="number" min="0" max="100" value={score} onChange={e=>setScore(e.target.value)}/></Field><Field label="نقش هدف"><input value={role} onChange={e=>setRole(e.target.value)}/></Field><Field label="یادداشت"><textarea value={notes} onChange={e=>setNotes(e.target.value)}/></Field></div><div className="modal-skills">{(member.skills||[]).map(s=><button key={s.name} onClick={()=>removeSkill(s.name)}>{s.name} ×</button>)}</div><div className="modal-actions"><button className="button button-danger" onClick={()=>setConfirming(true)}><Icon name="trash" size={16}/> حذف عضو</button><button className="button button-outline" onClick={async()=>{try{await api('/admin/assessments',{method:'POST',body:JSON.stringify({memberId:member.id,status,score:Number(score),role,notes})});onDone()}catch(e){notify(e.message)}}}>ثبت ارزیابی</button><button className="button button-main" onClick={save}>ذخیره تغییرات <Icon name="check" size={16}/></button></div></div></div>{confirming&&<ConfirmDialog title="حذف عضو" text="عضو از دسترس عمومی خارج می‌شود و داده‌های او برای Audit نگه داشته می‌شوند. ادامه می‌دهی؟" onCancel={()=>setConfirming(false)} onConfirm={deleteMember}/>}</> ; }

function ConfirmDialog({title,text,onCancel,onConfirm}){ return <div className="modal-backdrop confirm-backdrop" role="presentation"><div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><span className="eyebrow">تأیید عملیات</span><h2 id="confirm-title">{title}</h2><p>{text}</p><div className="confirm-actions"><button className="button button-outline" onClick={onCancel}>انصراف</button><button className="button button-danger" onClick={onConfirm}>تأیید و ادامه</button></div></div></div>; }

function initials(name='G'){ const normalized=String(name).normalize('NFKC').replace(/[\u200c\u200d]/g,' ').trim().replace(/\s+/g,' '); const parts=normalized.split(' ').filter(Boolean); return (parts.length===1?parts[0].slice(0,2):parts.slice(0,2).map(x=>x[0]).join('')).toUpperCase()||'G'; }
function Footer(){ return <footer className="site-footer"><div className="container footer-grid"><div><Logo/><p>رشد → اثبات → توانمندی → فرصت</p></div><div className="footer-links"><a href="/#about">درباره</a><a href="/#journey">مسیر رشد</a><Link to="/members">اعضا</Link>{new Date().getFullYear()&&<span>© {new Date().getFullYear()} GrowLand</span>}</div></div></footer>; }

createRoot(document.getElementById('root')).render(<ErrorBoundary><BrowserRouter><App/></BrowserRouter></ErrorBoundary>);
