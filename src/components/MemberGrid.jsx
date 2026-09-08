import MemberCard from './MemberCard';
import SkeletonCard from './SkeletonCard';
import './MemberGrid.css';

function EmptyState({ query }) {
  return (
    <div className="member-grid__empty" role="status">
      <div className="member-grid__empty-icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <h3 className="member-grid__empty-title">No explorers found</h3>
      <p className="member-grid__empty-desc">
        {query
          ? `No members match "${query}". Try a different search or filter.`
          : 'No members match the current filters.'}
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="member-grid__error" role="alert">
      <div className="member-grid__error-icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <h3 className="member-grid__error-title">Growth data unavailable</h3>
      <p className="member-grid__error-desc">
        {error || 'Something went wrong while loading the growth data.'}
      </p>
      {onRetry && (
        <button className="member-grid__retry" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export default function MemberGrid({ users, loading, error, query, onCardClick, onRetry }) {
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (loading) {
    return (
      <div
        className="member-grid"
        aria-label="Loading members"
        aria-busy="true"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return <EmptyState query={query} />;
  }

  return (
    <div
      className="member-grid"
      aria-label={`${users.length} member profiles`}
    >
      {users.map((user, index) => (
        <MemberCard
          key={user.id || index}
          user={user}
          index={index}
          onClick={() => onCardClick(user)}
        />
      ))}
    </div>
  );
}
