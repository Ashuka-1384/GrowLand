import './SkeletonCard.css';

export default function SkeletonCard() {
  return (
    <div
      className="skeleton-card"
      aria-hidden="true"
      aria-label="Loading member card"
    >
      <div className="skeleton-card__header">
        <div className="skeleton skeleton-card__avatar" />
        <div className="skeleton-card__identity">
          <div className="skeleton skeleton-card__name" />
          <div className="skeleton skeleton-card__meta" />
        </div>
        <div className="skeleton skeleton-card__badge" />
      </div>
      <div className="skeleton skeleton-card__bar" />
      <div className="skeleton-card__skills">
        <div className="skeleton skeleton-card__skill" />
        <div className="skeleton skeleton-card__skill skeleton-card__skill--sm" />
        <div className="skeleton skeleton-card__skill skeleton-card__skill--lg" />
      </div>
      <div className="skeleton skeleton-card__footer" />
    </div>
  );
}
