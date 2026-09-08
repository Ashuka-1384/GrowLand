import { getLevelTier, getLevelTierLabel } from '../utils/xp';
import './LevelBadge.css';

export default function LevelBadge({ level, size = 'md', showTier = false }) {
  const tier = getLevelTier(level || 0);
  const tierLabel = getLevelTierLabel(level || 0);
  const displayLevel = String(level || 0).padStart(2, '0');

  return (
    <div
      className={`level-badge level-badge--${tier} level-badge--${size}`}
      title={`Level ${level} — ${tierLabel}`}
      aria-label={`Level ${level}, ${tierLabel} tier`}
    >
      <div className="level-badge__ring" aria-hidden="true" />
      <div className="level-badge__content">
        <span className="level-badge__label">LVL</span>
        <span className="level-badge__number">{displayLevel}</span>
      </div>
      {showTier && (
        <span className="level-badge__tier" aria-label={`Tier: ${tierLabel}`}>
          {tierLabel}
        </span>
      )}
    </div>
  );
}
