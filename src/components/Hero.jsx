import { useRef } from 'react';
import './Hero.css';

export default function Hero(){
  const ref=useRef(null);
  const onMove=(e)=>{const el=ref.current;if(!el)return;const r=el.getBoundingClientRect();el.style.setProperty('--mx',`${((e.clientX-r.left)/r.width)*100}%`);el.style.setProperty('--my',`${((e.clientY-r.top)/r.height)*100}%`)};
  return <section ref={ref} className="hero" onMouseMove={onMove} aria-label="GrowLand hero section">
    <div className="hero__orb hero__orb--a"/><div className="hero__orb hero__orb--b"/><div className="hero__mesh"/><div className="hero__line hero__line--1"/><div className="hero__line hero__line--2"/>
    <div className="container hero__content">
      <div className="hero__copy">
        <div className="hero__tag anim-fade-up delay-1"><span className="hero__tag-dot"/><span>Growth operating system</span><span className="hero__tag-live">LIVE DATA</span></div>
        <h1 className="hero__title anim-fade-up delay-2">Turn effort into <em>evidence.</em></h1>
        <p className="hero__subtitle anim-fade-up delay-3">A modern growth dashboard for tracking members, skills, XP and momentum — designed to make progress feel tangible.</p>
        <div className="hero__cta anim-fade-up delay-4"><button className="hero__cta-btn hero__cta-btn--primary" onClick={()=>document.getElementById('members')?.scrollIntoView({behavior:'smooth'})}>Explore members <span>↗</span></button><button className="hero__cta-btn hero__cta-btn--secondary" onClick={()=>document.getElementById('leaderboard')?.scrollIntoView({behavior:'smooth'})}>See top growers</button></div>
        <div className="hero__micro anim-fade-up delay-5"><span><i/> Live progression</span><span>•</span><span>Skill proof</span><span>•</span><span>XP momentum</span></div>
      </div>
      <div className="hero__visual anim-fade-up delay-3" aria-hidden="true">
        <div className="hero__visual-glow"/>
        <div className="hero__panel hero__panel--back"><span>COMMUNITY / 24</span><b>+18.4%</b></div>
        <div className="hero__panel hero__panel--main"><div className="hero__panel-top"><span>GROWTH PULSE</span><span>●</span></div><div className="hero__score">8.7<span>/10</span></div><div className="hero__graph"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="hero__panel-foot"><span>Skills validated</span><strong>92%</strong></div></div>
        <div className="hero__badge hero__badge--one"><span>XP</span><b>+1,240</b></div><div className="hero__badge hero__badge--two"><span>LEVEL</span><b>12</b></div>
      </div>
    </div>
    <div className="hero__scroll"><span>SCROLL TO EXPLORE</span><i/></div>
  </section>
}
