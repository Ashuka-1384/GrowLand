import { useEffect, useRef } from 'react';
import './Hero.css';

function Particle({ style }) {
  return <div className="hero__particle" style={style} aria-hidden="true" />;
}

export default function Hero() {
  const particlesRef = useRef([]);

  // Generate stable particles
  if (particlesRef.current.length === 0) {
    particlesRef.current = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`,
      delay: `${Math.random() * 8}s`,
      duration: `${Math.random() * 6 + 8}s`,
    }));
  }

  return (
    <section className="hero" aria-label="GrowLand hero section">
      {/* Particles */}
      <div className="hero__particles" aria-hidden="true">
        {particlesRef.current.map((p) => (
          <Particle
            key={p.id}
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Central glow */}
      <div className="hero__glow" aria-hidden="true" />

      {/* Rings */}
      <div className="hero__rings" aria-hidden="true">
        <div className="hero__ring hero__ring--1" />
        <div className="hero__ring hero__ring--2" />
        <div className="hero__ring hero__ring--3" />
      </div>

      <div className="container hero__content">
        {/* Tag */}
        <div className="hero__tag anim-fade-up delay-1">
          <span className="hero__tag-dot" aria-hidden="true" />
          <span>Growth Operating System</span>
        </div>

        {/* Title */}
        <h1 className="hero__title anim-fade-up delay-2">
          <span className="hero__title-line">Grow. Prove.</span>
          <span className="hero__title-line hero__title-line--accent">
            Get There.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero__subtitle anim-fade-up delay-3">
          Track your growth. Build real skills. Prove your progress.
          <br />
          GrowLand turns effort into evidence — and evidence into opportunity.
        </p>

        {/* Stats row */}
        <div className="hero__stats anim-fade-up delay-4" aria-label="Quick stats">
          <div className="hero__stat">
            <span className="hero__stat-label">Member → Growth</span>
          </div>
          <div className="hero__stat-divider" aria-hidden="true">→</div>
          <div className="hero__stat">
            <span className="hero__stat-label">Skill → Proof</span>
          </div>
          <div className="hero__stat-divider" aria-hidden="true">→</div>
          <div className="hero__stat">
            <span className="hero__stat-label">Level → Job</span>
          </div>
        </div>

        {/* CTA */}
        <div className="hero__cta anim-fade-up delay-5">
          <button
            className="hero__cta-btn hero__cta-btn--primary"
            onClick={() => {
              document.getElementById('members')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span>Explore Members</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button
            className="hero__cta-btn hero__cta-btn--secondary"
            onClick={() => {
              document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            View Leaderboard
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="hero__scroll-indicator anim-fade-up delay-6" aria-hidden="true">
          <div className="hero__scroll-mouse">
            <div className="hero__scroll-wheel" />
          </div>
        </div>
      </div>
    </section>
  );
}
