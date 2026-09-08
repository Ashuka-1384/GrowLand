import { Component, useCallback, useRef, useState } from 'react';
import { useUsers } from './hooks/useUsers';
import { applyFiltersAndSort, getUniqueCities, getUniqueSkills } from './utils/filters';

import Header from './components/Header';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Leaderboard from './components/Leaderboard';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import MemberGrid from './components/MemberGrid';
import MemberModal from './components/MemberModal';

import './styles/globals.css';
import './App.css';

class AppErrorBoundary extends Component {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected application error.' };
  }

  componentDidCatch(error) {
    // Keep error reporting local and dependency-free.
    console.error('GrowLand runtime error:', error);
  }

  handleReload = () => window.location.reload();

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error" role="alert">
          <div className="app-error__card">
            <span className="app-error__eyebrow">GROWLAND / RECOVERY</span>
            <h1>Something interrupted the dashboard.</h1>
            <p>{this.state.message}</p>
            <button onClick={this.handleReload}>Reload dashboard</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { users, loading, error, updateUserXP, getUserHistory, resetUsers } = useUsers();
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [sortBy, setSortBy] = useState('level-desc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminMode, setAdminMode] = useState(() => {
    try {
      return window.sessionStorage.getItem('growland-admin-mode') === '1';
    } catch {
      return false;
    }
  });
  const searchRef = useRef(null);

  const filteredUsers = applyFiltersAndSort(users, {
    query,
    levelFilter,
    city: cityFilter,
    skill: skillFilter,
    sortBy,
  });

  const cities = getUniqueCities(users);
  const skills = getUniqueSkills(users);

  const handleSearchFocus = useCallback(() => {
    searchRef.current?.querySelector('input')?.focus();
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleCardClick = useCallback((user) => setSelectedUser(user), []);
  const handleModalClose = useCallback(() => setSelectedUser(null), []);
  const handleRetry = useCallback(() => window.location.reload(), []);

  const toggleAdminMode = useCallback(() => {
    setAdminMode((current) => {
      const next = !current;
      try {
        window.sessionStorage.setItem('growland-admin-mode', next ? '1' : '0');
      } catch {
        // Session storage may be blocked by privacy settings. Mode still works for this session.
      }
      return next;
    });
  }, []);

  const handleXPChange = useCallback((userId, delta, reason) => {
    const result = updateUserXP(userId, delta, reason);
    if (result.ok && result.user) setSelectedUser(result.user);
    return result;
  }, [updateUserXP]);

  const handleReset = useCallback(() => {
    const baseline = resetUsers();
    if (selectedUser) {
      const restored = baseline.find((user) => user.id === selectedUser.id);
      setSelectedUser(restored || null);
    }
  }, [resetUsers, selectedUser]);

  return (
    <AppErrorBoundary>
      <div className="app">
      <div className="page-background" aria-hidden="true">
        <div className="page-background__grid" />
        <div className="page-background__glow-1" />
        <div className="page-background__glow-2" />
        <div className="page-background__noise" />
      </div>

      <div className="page-content">
        <Header
          onSearchFocus={handleSearchFocus}
          adminMode={adminMode}
          onAdminModeToggle={toggleAdminMode}
        />

        <main id="main-content">
          <Hero />

          {!loading && !error && users.length > 0 && <Stats users={users} />}
          {!loading && !error && users.length > 0 && (
            <Leaderboard users={users} onCardClick={handleCardClick} />
          )}

          <section id="members" className="members-section section" aria-label="Member directory">
            <div className="container">
              <div className="section-title">
                <div className="section-title__dot" aria-hidden="true" />
                <h2>Member Directory</h2>
              </div>

              <div className="members-section__headline-row">
                <p className="members-section__desc">Every profile is a story of growth in progress.</p>
                <div className={`workspace-chip ${adminMode ? 'workspace-chip--active' : ''}`}>
                  <span className="workspace-chip__dot" />
                  {adminMode ? 'Manager controls enabled' : 'Read-only workspace'}
                </div>
              </div>

              <div className="members-section__controls">
                <SearchBar value={query} onChange={setQuery} searchRef={searchRef} />
              </div>

              {!loading && !error && (
                <FilterBar
                  levelFilter={levelFilter}
                  onLevelChange={setLevelFilter}
                  cityFilter={cityFilter}
                  onCityChange={setCityFilter}
                  skillFilter={skillFilter}
                  onSkillChange={setSkillFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  cities={cities}
                  skills={skills}
                  resultCount={filteredUsers.length}
                  totalCount={users.length}
                />
              )}

              <MemberGrid
                users={filteredUsers}
                loading={loading}
                error={error}
                query={query}
                onCardClick={handleCardClick}
                onRetry={handleRetry}
              />

              {adminMode && !loading && !error && users.length > 0 && (
                <div className="admin-toolbar">
                  <div>
                    <span className="admin-toolbar__eyebrow">WORKSPACE CONTROL</span>
                    <strong>XP changes persist in this browser</strong>
                  </div>
                  <button className="admin-toolbar__reset" onClick={handleReset}>Reset demo data</button>
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="footer" role="contentinfo">
          <div className="container footer__inner">
            <div className="footer__brand">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path d="M3 16 L8 8 L12 13 L16 6" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="16" cy="6" r="2" fill="#00FF88" />
              </svg>
              <span>GrowLand</span>
            </div>
            <p className="footer__tagline">Growth made visible.</p>
            <p className="footer__copy">© {new Date().getFullYear()} GrowLand. All growth is real.</p>
          </div>
        </footer>
      </div>

      {selectedUser && (
        <MemberModal
          user={selectedUser}
          onClose={handleModalClose}
          adminMode={adminMode}
          onXPChange={handleXPChange}
          history={getUserHistory(selectedUser.id)}
        />
      )}
      </div>
    </AppErrorBoundary>
  );
}
