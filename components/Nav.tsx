'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';

export default function Nav(){
 const [open,setOpen]=useState(false); const [me,setMe]=useState<any>(null);
 useEffect(()=>{fetch('/api/auth/me').then(r=>r.ok?r.json():null).then(x=>setMe(x?.member||null)).catch(()=>{});},[]);
 const links=[['/members','تمام ممبرها'],['/ranking','رکینگ'],...(me?[['/dashboard','پنل رشد']]:[])];
 return <header className="nav"><div className="container navin">
   <Link href="/" className="brand"><img src="/logo.jpg" alt="GrowLand"/><span>Grow<b>Land</b></span></Link>
   <button className="mobileBtn" onClick={()=>setOpen(!open)}>☰</button>
   <nav className={'navlinks '+(open?'open':'')}>{links.map(([h,t])=><Link key={h} href={h} onClick={()=>setOpen(false)}>{t}</Link>)}<a href="/#about">درباره ما</a></nav>
   <div className="actions">{me?.isAdmin&&<Link className="btn" href="/admin">پنل ادمین</Link>}{me?<button className="btn ghost" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});location.href='/';}}>خروج</button>:<><Link className="btn" href="/login">ورود</Link><Link className="btn primary" href="/signup">ثبت‌نام</Link></>}</div>
 </div></header>
}
