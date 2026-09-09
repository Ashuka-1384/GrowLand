import { useEffect, useRef, useState } from 'react';
import { buildStats } from '../utils/stats';
import { MAX_LEVEL, MAX_XP, levelFromXP } from '../utils/xp';
import { useCountUp } from '../hooks/useCountUp';
import './Stats.css';

function StatCard({ icon, label, children, delay = 0, className = '' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`stat-card ${visible ? 'stat-card--visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
      ref={ref}
    >
      <div className="stat-card__icon" aria-hidden="true">{icon}</div>
      <div className="stat-card__content">
        {children}
        <div className="stat-card__label">{label}</div>
      </div>
      <div className="stat-card__glow" aria-hidden="true" />
    </div>
  );
}

function AnimatedNumber({ value, isFloat = false, start = false }) {
  const count = useCountUp(
    isNaN(parseFloat(value)) ? 0 : parseFloat(value),
    1500,
    start
  );
  return (
    <div className="stat-card__value">
      {isFloat ? count.toFixed(1) : count.toLocaleString()}
    </div>
  );
}

export default function Stats({ users }) {
  const stats = buildStats(users);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const iconMembers = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  const iconLevel = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );

  const iconXP = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );

  const highestLevel = users.length ? Math.max(...users.map((user) => levelFromXP(user.xp))) : 0;
  const maxProgress = users.filter((user) => Number(user.xp) >= MAX_XP).length;

  const iconSkill = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );

  return (
    <section
      className="stats-section section--sm"
      id="stats"
      aria-label="Community statistics"
      ref={sectionRef}
    >
      <div className="container">
        <div className="section-title">
          <div className="section-title__dot" aria-hidden="true" />
          <h2>Community Overview</h2>
        </div>

        <div className="stats-grid">
          <StatCard icon={iconMembers} label="Members" delay={0.05}>
            <AnimatedNumber value={stats.totalMembers} start={visible} />
          </StatCard>

          <StatCard icon={iconLevel} label="Average Level" delay={0.15}>
            <AnimatedNumber value={parseFloat(stats.averageLevel)} isFloat start={visible} />
          </StatCard>

          <StatCard icon={iconXP} label="Total XP Earned" delay={0.25}>
            <AnimatedNumber value={stats.totalXP} start={visible} />
          </StatCard>

          <StatCard icon={iconSkill} label="Top Skill" delay={0.35}>
            <div className="stat-card__value stat-card__value--text">{stats.topSkill}</div>
          </StatCard>
        </div>

        <div className="stats-pulse" aria-label="Progression pulse">
          <span><b>{highestLevel}</b> highest level</span>
          <span><b>{maxProgress}</b> max-level members</span>
          <span><b>{MAX_LEVEL}</b> level cap</span>
          <span><b>1,000</b> XP per level</span>
        </div>
      </div>
    </section>
  );
}
