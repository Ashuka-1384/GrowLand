import { useEffect, useCallback, useState } from 'react';
import { Avatar } from './MemberCard';
import LevelBadge from './LevelBadge';
import XPBar from './XPBar';
import SkillTag from './SkillTag';
import { getLevelProgress, getLevelTierLabel, QUICK_XP_AMOUNTS } from '../utils/xp';
import './MemberModal.css';

function formatRelativeTime(date) {
  const ms = Date.now() - new Date(date).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function MemberModal({ user, onClose, adminMode = false, onXPChange, history = [] }) {
  const [customXP, setCustomXP] = useState('');
  const [notice, setNotice] = useState(null);
  const { name = 'Unknown', age, city, goal, xp = 0, skills = [] } = user || {};
  const progression = getLevelProgress(xp);
  const level = progression.level;
  const tierLabel = getLevelTierLabel(level);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [handleKeyDown]);

  const applyXP = (delta, reason = 'Manager XP grant') => {
    const result = onXPChange?.(user.id, delta, reason);
    if (!result?.ok) {
      setNotice({ type: 'error', text: result?.error || 'XP could not be changed.' });
      return;
    }
    const levelUp = result.entry?.levelChanged && result.entry.levelAfter > result.entry.levelBefore;
    setNotice({
      type: levelUp ? 'level' : 'success',
      text: levelUp
        ? `Level up! ${name} reached Level ${result.entry.levelAfter}.`
        : `${delta > 0 ? '+' : ''}${delta.toLocaleString()} XP applied.`,
    });
    setCustomXP('');
  };

  const handleCustom = () => {
    const value = Number(customXP);
    if (!Number.isFinite(value) || value <= 0) {
      setNotice({ type: 'error', text: 'Enter a positive XP amount.' });
      return;
    }
    applyXP(Math.round(value), 'Custom XP grant');
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label={`Growth profile for ${name}`}>
      <div className="modal">
        <button className="modal__close" onClick={onClose} aria-label="Close profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <div className="modal__bg-glow" aria-hidden="true" />

        <div className="modal__header">
          <Avatar name={name} size="xl" />
          <div className="modal__identity">
            <div className="modal__tier-tag"><span className="modal__tier-dot" />{tierLabel} Grower</div>
            <h2 className="modal__name">{name}</h2>
            <div className="modal__meta">
              {city && <span className="modal__meta-item">⌖ {city}</span>}
              {age && <span className="modal__meta-item">◷ {age} years old</span>}
            </div>
          </div>
          <LevelBadge level={level} size="xl" showTier />
        </div>

        <div className="modal__divider" />

        <div className="modal__section">
          <div className="modal__section-heading">
            <h3 className="modal__section-title"><span className="modal__section-kicker">XP</span> Growth Progress</h3>
            <span className="modal__micro-status">{progression.isMaxLevel ? 'MAX LEVEL' : `NEXT • ${progression.level + 1}`}</span>
          </div>
          <div className="modal__xp"><XPBar xp={xp} level={level} size="lg" animated /></div>
          <div className="modal__progress-grid">
            <div><span>Current</span><strong>Level {level}</strong></div>
            <div><span>In level</span><strong>{progression.progressXP.toLocaleString()} XP</strong></div>
            <div><span>Remaining</span><strong>{progression.xpNeeded.toLocaleString()} XP</strong></div>
          </div>
          <div className="modal__level-note">Level is derived automatically from XP. <span className="modal__level-note-accent">Level ≠ Job Readiness</span></div>
        </div>

        {adminMode && (
          <div className="modal__section modal__admin-section">
            <div className="modal__section-heading">
              <h3 className="modal__section-title"><span className="modal__section-kicker">CONTROL</span> Award XP</h3>
              <span className="modal__micro-status">DEMO MANAGER</span>
            </div>
            <div className="modal__quick-actions">
              {QUICK_XP_AMOUNTS.map((amount) => (
                <button key={amount} className="modal__xp-action" onClick={() => applyXP(amount, `Quick grant +${amount} XP`)}>
                  +{amount.toLocaleString()} <span>XP</span>
                </button>
              ))}
            </div>
            <div className="modal__custom-action">
              <input
                value={customXP}
                onChange={(e) => setCustomXP(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="Custom XP"
                aria-label="Custom XP amount"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCustom(); } }}
              />
              <button onClick={handleCustom}>Add XP</button>
            </div>
            {notice && <div className={`modal__notice modal__notice--${notice.type}`}>{notice.text}</div>}
            <p className="modal__admin-note">Demo changes are stored only in this browser. This is not authentication or shared production storage.</p>
          </div>
        )}

        <div className="modal__section">
          <h3 className="modal__section-title"><span className="modal__section-kicker">SKILLS</span> Skill Stack</h3>
          {Array.isArray(skills) && skills.length > 0 ? (
            <div className="modal__skills">
              {skills.map((skill, i) => (
                <div key={`${skill.name}-${i}`} className="modal__skill-row">
                  <span className="modal__skill-name">{skill.name}</span>
                  <div className="modal__skill-right">
                    <div className="modal__skill-bar-track"><div className="modal__skill-bar-fill" style={{ width: `${(Math.min(Math.max(skill.level || 0, 0), 5) / 5) * 100}%` }} /></div>
                    <SkillTag name={skill.name} level={skill.level} compact />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="modal__empty">No skills added to this profile yet.</p>}
        </div>

        {history.length > 0 && (
          <div className="modal__section">
            <div className="modal__section-heading">
              <h3 className="modal__section-title"><span className="modal__section-kicker">LOG</span> Recent XP Activity</h3>
              <span className="modal__micro-status">LAST {history.length}</span>
            </div>
            <div className="modal__history">
              {history.map((entry) => (
                <div className="modal__history-row" key={entry.id}>
                  <span className={`modal__history-delta ${entry.delta > 0 ? 'modal__history-delta--up' : ''}`}>{entry.delta > 0 ? '+' : ''}{entry.delta.toLocaleString()}</span>
                  <span className="modal__history-reason">{entry.reason}</span>
                  <span className="modal__history-time">{formatRelativeTime(entry.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {goal && (
          <div className="modal__section">
            <h3 className="modal__section-title"><span className="modal__section-kicker">GOAL</span> Growth Goal</h3>
            <div className="modal__goal">{goal}</div>
          </div>
        )}
      </div>
    </div>
  );
}
