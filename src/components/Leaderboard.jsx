import { getTopGrowers } from '../utils/stats';
import { getLevelTier, levelFromXP } from '../utils/xp';
import './Leaderboard.css';

const RANK_LABELS = ['', '🥇', '🥈', '🥉'];
const RANK_CLASSES = ['', 'leaderboard-item--gold', 'leaderboard-item--silver', 'leaderboard-item--bronze'];

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function Leaderboard({ users, onCardClick }) {
  const topGrowers = getTopGrowers(users, 3);

  if (!topGrowers.length) return null;

  return (
    <section
      className="leaderboard-section section--sm"
      id="leaderboard"
      aria-label="Top growers leaderboard"
    >
      <div className="container">
        <div className="section-title">
          <div className="section-title__dot" aria-hidden="true" />
          <h2>Top Growers</h2>
        </div>

        <p className="leaderboard-subtitle">
          Members leading the way — ranked by total XP earned.
        </p>

        <div className="leaderboard-list" role="list">
          {topGrowers.map((user, index) => {
            const rank = index + 1;
            const level = levelFromXP(user.xp);
            const tier = getLevelTier(level);
            const hue = (user.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

            return (
              <div
                key={user.id}
                className={`leaderboard-item ${RANK_CLASSES[rank]}`}
                role="listitem"
                onClick={() => onCardClick(user)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardClick(user); }
                }}
                tabIndex={0}
                aria-label={`Rank ${rank}: ${user.name}, Level ${level}, ${(user.xp || 0).toLocaleString()} XP`}
              >
                {/* Rank */}
                <div className="leaderboard-item__rank" aria-hidden="true">
                  {rank <= 3 ? (
                    <span className="leaderboard-item__rank-emoji">{RANK_LABELS[rank]}</span>
                  ) : (
                    <span className="leaderboard-item__rank-num">#{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className="leaderboard-item__avatar"
                  style={{
                    background: `linear-gradient(135deg,
                      hsla(${hue}, 60%, 25%, 0.8),
                      hsla(${hue + 40}, 60%, 20%, 0.8))`,
                    borderColor: `hsla(${hue}, 60%, 40%, 0.3)`,
                  }}
                  aria-hidden="true"
                >
                  <span>{getInitials(user.name)}</span>
                </div>

                {/* Info */}
                <div className="leaderboard-item__info">
                  <span className="leaderboard-item__name">{user.name}</span>
                  <span className="leaderboard-item__details">
                    {user.city && <span>{user.city}</span>}
                    {user.goal && <span>· {user.goal}</span>}
                  </span>
                </div>

                {/* Stats */}
                <div className="leaderboard-item__stats">
                  <div className={`leaderboard-item__level leaderboard-item__level--${tier}`}>
                    Level {level}
                  </div>
                  <div className="leaderboard-item__xp">
                    {(user.xp || 0).toLocaleString()} XP
                  </div>
                </div>

                {/* Arrow */}
                <div className="leaderboard-item__arrow" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
