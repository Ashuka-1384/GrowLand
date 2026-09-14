import { useEffect, useRef, useState } from 'react';
import LevelBadge from './LevelBadge';
import { getLevelProgress, getLevelTierLabel, levelFromXP } from '../utils/xp';
import XPBar from './XPBar';
import SkillTag from './SkillTag';
import './MemberCard.css';

function getInitials(name = '') { return name.split(' ').slice(0,2).map((w)=>w[0]).join('').toUpperCase(); }
function hueFromName(name='') { return name.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%360; }

function Avatar({ name, size='md' }) {
  const initials=getInitials(name); const hue=hueFromName(name);
  return <div className={`member-avatar member-avatar--${size}`} style={{'--avatar-hue':hue}} aria-label={`Avatar for ${name}`}>
    <span className="member-avatar__shine" aria-hidden="true"/><span className="member-avatar__initials">{initials}</span><span className="member-avatar__orbit" aria-hidden="true"/>
  </div>;
}

export default function MemberCard({ user, onClick, index=0 }) {
  const [visible,setVisible]=useState(false);
  const ref=useRef(null); const innerRef=useRef(null);
  const {name='Unknown',age,city,goal,xp=0,skills=[]}=user||{};
  const level=levelFromXP(xp); const progress=getLevelProgress(xp); const tier=getLevelTierLabel(level);

  useEffect(()=>{
    if(typeof IntersectionObserver==='undefined'){setVisible(true);return;}
    const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)setVisible(true)},{threshold:.08});
    if(ref.current) observer.observe(ref.current); return ()=>observer.disconnect();
  },[]);

  const handleMove=(e)=>{
    if(!innerRef.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r=ref.current.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width; const y=(e.clientY-r.top)/r.height;
    innerRef.current.style.setProperty('--rx', `${(0.5-y)*8}deg`); innerRef.current.style.setProperty('--ry', `${(x-0.5)*10}deg`); innerRef.current.style.setProperty('--mx', `${x*100}%`); innerRef.current.style.setProperty('--my', `${y*100}%`);
  };
  const resetMove=()=>{ if(innerRef.current){innerRef.current.style.setProperty('--rx','0deg');innerRef.current.style.setProperty('--ry','0deg');innerRef.current.style.setProperty('--mx','50%');innerRef.current.style.setProperty('--my','50%');} };
  const visibleSkills=Array.isArray(skills)?skills.slice(0,3):[]; const extraSkills=Math.max(0,(skills?.length||0)-3);

  return <article ref={ref} className={`member-card ${visible?'member-card--visible':''}`} style={{'--delay':`${Math.min(index*.045,.45)}s`}} onClick={onClick} onMouseMove={handleMove} onMouseLeave={resetMove}
    onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick?.();}}} tabIndex={0} role="button" aria-label={`View ${name}'s growth profile`}>
    <div ref={innerRef} className="member-card__inner">
      <div className="member-card__halo" aria-hidden="true"/><div className="member-card__shine" aria-hidden="true"/>
      <div className="member-card__topline"><span className="member-card__serial">GL / {String(user?.id??index+1).padStart(3,'0')}</span><span className="member-card__tier"><i/> {tier}</span></div>
      <div className="member-card__header">
        <Avatar name={name} size="lg"/>
        <div className="member-card__identity"><h3 className="member-card__name">{name}</h3><div className="member-card__meta">{city&&<span>⌖ {city}</span>}{age&&<span>{age} yrs</span>}</div>{goal&&<p className="member-card__goal-line">{goal}</p>}</div>
        <div className="member-card__level-wrap"><LevelBadge level={level} size="sm"/></div>
      </div>
      <div className="member-card__xp-wrap"><div className="member-card__xp-head"><span>Growth progress</span><strong>{xp.toLocaleString()} XP</strong></div><XPBar xp={xp} level={level} size="sm" animated/><div className="member-card__xp-foot"><span>LVL {level}</span><span>{progress.isMaxLevel?'MAXED':`${progress.xpNeeded.toLocaleString()} XP TO NEXT`}</span></div></div>
      <div className="member-card__skills"><div className="member-card__skills-title"><span>Skill stack</span><span>{skills?.length||0} tracked</span></div><div className="member-card__skills-list">{visibleSkills.map((skill,i)=><SkillTag key={`${skill.name}-${i}`} name={skill.name} level={skill.level}/>)}{extraSkills>0&&<span className="member-card__skills-more">+{extraSkills}</span>}{visibleSkills.length===0&&<span className="member-card__skills-empty">No skills added yet</span>}</div></div>
      <div className="member-card__footer"><span className="member-card__hint">Open growth profile</span><span className="member-card__cta" aria-hidden="true">↗</span></div>
    </div>
  </article>;
}

export { Avatar, getInitials };
