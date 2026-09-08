import { useState } from 'react';
import './SkillTag.css';

const SKILL_COLORS = {
  1: { bg: 'rgba(139, 148, 158, 0.1)', border: 'rgba(139, 148, 158, 0.25)', text: '#8b949e' },
  2: { bg: 'rgba(88, 166, 255, 0.08)', border: 'rgba(88, 166, 255, 0.25)', text: '#58a6ff' },
  3: { bg: 'rgba(0, 201, 107, 0.08)', border: 'rgba(0, 201, 107, 0.25)', text: '#00c96b' },
  4: { bg: 'rgba(0, 255, 136, 0.1)', border: 'rgba(0, 255, 136, 0.3)', text: '#00ff88' },
  5: { bg: 'rgba(255, 215, 0, 0.08)', border: 'rgba(255, 215, 0, 0.3)', text: '#ffd700' },
};

const LEVEL_LABELS = {
  1: 'Beginner',
  2: 'Basic',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export default function SkillTag({ name, level = 1, compact = false }) {
  const [hovered, setHovered] = useState(false);
  const colors = SKILL_COLORS[Math.min(Math.max(level, 1), 5)] || SKILL_COLORS[1];
  const label = LEVEL_LABELS[Math.min(Math.max(level, 1), 5)] || 'Beginner';

  return (
    <div
      className="skill-tag"
      style={{
        backgroundColor: colors.bg,
        borderColor: hovered ? colors.text : colors.border,
        color: colors.text,
        boxShadow: hovered ? `0 0 10px ${colors.border}` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${name} — ${label}`}
      aria-label={`${name}, skill level ${level} (${label})`}
    >
      {!compact && <span className="skill-tag__name">{name}</span>}
      <span className="skill-tag__level">Lv.{level}</span>
      {hovered && (
        <span className="skill-tag__tooltip" role="tooltip">
          {label}
        </span>
      )}
    </div>
  );
}
