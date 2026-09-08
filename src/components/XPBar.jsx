import { useEffect, useRef, useState } from 'react';
import { getLevelProgress, MAX_LEVEL } from '../utils/xp';
import './XPBar.css';

export default function XPBar({ xp = 0, level = 1, size = 'md', animated = true }) {
  const [progress, setProgress] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const barRef = useRef(null);
  const hasAnimated = useRef(false);

  const meta = getLevelProgress(xp);

  useEffect(() => {
    if (!animated) {
      setProgress(meta.percentage);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setTimeout(() => setProgress(meta.percentage), 120);
        }
      },
      { threshold: 0.25 }
    );

    if (barRef.current) observer.observe(barRef.current);
    return () => observer.disconnect();
  }, [meta.percentage, animated]);

  return (
    <div
      className={`xp-bar xp-bar--${size}`}
      ref={barRef}
      aria-label={
        meta.isMaxLevel
          ? `Max level ${MAX_LEVEL}, ${meta.currentXP.toLocaleString()} XP`
          : `Level ${meta.level}, ${meta.currentXP.toLocaleString()} out of ${meta.levelEndXP.toLocaleString()} XP`
      }
    >
      <div className="xp-bar__labels">
        <span className="xp-bar__xp">
          <span className="xp-bar__xp-current">{meta.currentXP.toLocaleString()}</span>
          <span className="xp-bar__xp-sep"> / </span>
          <span className="xp-bar__xp-total">{meta.levelEndXP.toLocaleString()} XP</span>
        </span>
        <span className="xp-bar__level">Lv.{meta.level}</span>
        <span className="xp-bar__percent">{Math.round(meta.percentage)}%</span>
      </div>

      <div
        className="xp-bar__track"
        role="progressbar"
        aria-valuenow={meta.currentXP}
        aria-valuemin={0}
        aria-valuemax={meta.levelEndXP}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        tabIndex={0}
      >
        <div className="xp-bar__fill" style={{ width: `${progress}%` }}>
          <div className="xp-bar__fill-glow" aria-hidden="true" />
          <div className="xp-bar__fill-shimmer" aria-hidden="true" />
        </div>

        {tooltipVisible && (
          <div className="xp-bar__tooltip" role="tooltip">
            {meta.isMaxLevel
              ? `MAX LEVEL • ${MAX_LEVEL}`
              : `${meta.xpNeeded.toLocaleString()} XP to Level ${meta.level + 1}`}
          </div>
        )}
      </div>

      {size !== 'sm' && (
        <div className="xp-bar__remaining">
          {meta.isMaxLevel ? 'Maximum progression reached' : `${meta.xpNeeded.toLocaleString()} XP to Level ${meta.level + 1}`}
        </div>
      )}
    </div>
  );
}
