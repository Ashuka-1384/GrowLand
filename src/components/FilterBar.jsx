import './FilterBar.css';

const LEVEL_FILTERS = [
  { value: 'all', label: 'All Levels' },
  { value: '1-5', label: 'Starter (1–5)' },
  { value: '6-10', label: 'Advanced (6–10)' },
  { value: '11-20', label: 'Elite (11–20)' },
  { value: '21+', label: 'Apex (21+)' },
];

const SORT_OPTIONS = [
  { value: 'level-desc', label: 'Highest Level' },
  { value: 'xp-desc', label: 'Most XP' },
  { value: 'level-asc', label: 'Lowest Level' },
  { value: 'name-asc', label: 'Name A–Z' },
];

export default function FilterBar({
  levelFilter,
  onLevelChange,
  cityFilter,
  onCityChange,
  skillFilter,
  onSkillChange,
  sortBy,
  onSortChange,
  cities = [],
  skills = [],
  resultCount,
  totalCount,
}) {
  return (
    <div className="filter-bar" role="search" aria-label="Filter and sort members">
      {/* Level filter pills */}
      <div className="filter-bar__section" role="group" aria-label="Filter by level">
        <div className="filter-bar__pills">
          {LEVEL_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-pill ${levelFilter === f.value ? 'filter-pill--active' : ''}`}
              onClick={() => onLevelChange(f.value)}
              aria-pressed={levelFilter === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdowns */}
      <div className="filter-bar__selects">
        {/* City */}
        {cities.length > 0 && (
          <div className="filter-select-wrap">
            <label htmlFor="city-filter" className="sr-only">Filter by city</label>
            <svg className="filter-select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <select
              id="city-filter"
              className="filter-select"
              value={cityFilter}
              onChange={(e) => onCityChange(e.target.value)}
            >
              <option value="all">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Skill */}
        {skills.length > 0 && (
          <div className="filter-select-wrap">
            <label htmlFor="skill-filter" className="sr-only">Filter by skill</label>
            <svg className="filter-select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <select
              id="skill-filter"
              className="filter-select"
              value={skillFilter}
              onChange={(e) => onSkillChange(e.target.value)}
            >
              <option value="all">All Skills</option>
              {skills.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {/* Sort */}
        <div className="filter-select-wrap">
          <label htmlFor="sort-select" className="sr-only">Sort members</label>
          <svg className="filter-select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18M7 12h10M11 18h2" />
          </svg>
          <select
            id="sort-select"
            className="filter-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result count */}
      <div className="filter-bar__count" aria-live="polite" aria-atomic="true">
        <span className="filter-bar__count-num">{resultCount}</span>
        <span className="filter-bar__count-label">
          {resultCount === totalCount
            ? ' members'
            : ` of ${totalCount} members`}
        </span>
      </div>
    </div>
  );
}
