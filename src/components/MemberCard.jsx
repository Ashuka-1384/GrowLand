import { useState, useEffect, useRef } from 'react';
import LevelBadge from './LevelBadge';
import { levelFromXP } from '../utils/xp';
import XPBar from './XPBar';
import SkillTag from './SkillTag';
import './MemberCard.css';

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function Avatar({ name, size = 'md' }) {
  const initials = getInitials(name);
  // Generate a consistent hue from name
  const hue = name
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div
      className={`member-avatar member-avatar--${size}`}
      style={{
        background: `linear-gradient(135deg,
          hsla(${hue}, 60%, 25%, 0.8) 0%,
          hsla(${hue + 40}, 60%, 20%, 0.8) 100%)`,
        borderColor: `hsla(${hue}, 60%, 40%, 0.3)`,
      }}
      aria-label={`Avatar for ${name}`}
    >
      <span className="member-avatar__initials">{initials}</span>
    </div>
  );
}

export default function MemberCard({ user, onClick, index = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  const {
    name = 'Unknown',
    age,
    city,
    goal,
    xp = 0,
    skills = [],
  } = user || {};

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const displayLevel = levelFromXP(xp);

  const visibleSkills = Array.isArray(skills) ? skills.slice(0, 3) : [];
  const extraSkills = Array.isArray(skills) ? skills.length - 3 : 0;

  return (
    <article
      className={`member-card ${visible ? 'member-card--visible' : ''}`}
      style={{ transitionDelay: `${Math.min(index * 0.05, 0.4)}s` }}
      ref={ref}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={0}
      aria-label={`View ${name}'s growth profile`}
      role="button"
    >
      {/* Card glow */}
      <div className="member-card__glow" aria-hidden="true" />

      {/* Header */}
      <div className="member-card__header">
        <Avatar name={name} size="md" />

        <div className="member-card__identity">
          <h3 className="member-card__name">{name}</h3>
          <div className="member-card__meta">
            {city && (
              <span className="member-card__city">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {city}
              </span>
            )}
            {age && (
              <span className="member-card__age">{age}y</span>
            )}
          </div>
        </div>

        <div className="member-card__level-wrap">
          <LevelBadge level={displayLevel} size="sm" />
        </div>
      </div>

      {/* XP Bar */}
      <div className="member-card__xp">
        <XPBar xp={xp} level={displayLevel} size="sm" animated />
      </div>

      {/* Skills */}
      <div className="member-card__skills">
        {visibleSkills.length > 0 ? (
          <>
            <div className="member-card__skills-list">
              {visibleSkills.map((skill, i) => (
                <SkillTag
                  key={`${skill.name}-${i}`}
                  name={skill.name}
                  level={skill.level}
                />
              ))}
              {extraSkills > 0 && (
                <span className="member-card__skills-more">
                  +{extraSkills}
                </span>
              )}
            </div>
          </>
        ) : (
          <span className="member-card__skills-empty">
            No skills added yet
          </span>
        )}
      </div>

      {/* Footer */}
      {goal && (
        <div className="member-card__footer">
          <div className="member-card__goal">
            <span className="member-card__goal-label">Goal</span>
            <span className="member-card__goal-value">{goal}</span>
          </div>
          <div className="member-card__cta" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}
    </article>
  );
}

export { Avatar, getInitials };
