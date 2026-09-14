import { useState, useEffect } from 'react';
import './Header.css';

const LIBRARY_URL = 'https://grow-land-archive.growland.workers.dev';

export default function Header({ onSearchFocus, onArticlesOpen, adminMode = false, onAdminModeToggle }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  const openArticles = () => {
    setMenuOpen(false);
    onArticlesOpen?.();
  };

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`} role="banner">
      <div className="container header__inner">
        <button className="header__logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="GrowLand — scroll to top">
          <img className="header__brand-image" src="/brand/growland-logo.png" alt="GrowLand" />
        </button>

        <nav className="header__nav" aria-label="Main navigation">
          <button className="header__nav-link" onClick={() => scrollTo('members')}>Members</button>
          <button className="header__nav-link" onClick={() => scrollTo('leaderboard')}>Top Growers</button>
          <button className="header__nav-link" onClick={() => scrollTo('stats')}>Stats</button>
          <button className="header__nav-link" onClick={openArticles}>Articles</button>
        </nav>

        <div className="header__actions">
          <a className="header__library-link" href={LIBRARY_URL} target="_blank" rel="noreferrer" aria-label="Open GrowLand Library">
            <span className="header__library-mark" aria-hidden="true">↗</span>
            <span>Library</span>
          </a>
          <button className={`header__admin-btn ${adminMode ? 'header__admin-btn--active' : ''}`} onClick={onAdminModeToggle} aria-pressed={adminMode} aria-label={adminMode ? 'Disable demo manager controls' : 'Enable demo manager controls'}>
            <span className="header__admin-dot" />
            <span>{adminMode ? 'Demo' : 'View'}</span>
          </button>
          <button className="header__search-btn" onClick={onSearchFocus} aria-label="Jump to search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span>Search</span>
          </button>
          <button className="header__menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            <span className={`header__menu-icon ${menuOpen ? 'header__menu-icon--open' : ''}`}>
              <span></span><span></span><span></span>
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="header__mobile-nav" aria-label="Mobile navigation">
          <button className="header__mobile-link" onClick={() => scrollTo('stats')}>Stats</button>
          <button className="header__mobile-link" onClick={() => scrollTo('leaderboard')}>Top Growers</button>
          <button className="header__mobile-link" onClick={() => scrollTo('members')}>Members</button>
          <button className="header__mobile-link" onClick={openArticles}>Articles / Archive</button>
          <a className="header__mobile-link header__mobile-link--external" href={LIBRARY_URL} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>Library ↗</a>
          <button className={`header__mobile-link ${adminMode ? 'header__mobile-link--active' : ''}`} onClick={onAdminModeToggle}>
            {adminMode ? 'Disable Demo Manager' : 'Enable Demo Manager'}
          </button>
        </nav>
      )}
    </header>
  );
}
