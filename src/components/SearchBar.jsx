import { useRef } from 'react';
import './SearchBar.css';

export default function SearchBar({ value, onChange, searchRef }) {
  const inputRef = useRef(null);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="search-bar" ref={searchRef}>
      <label htmlFor="member-search" className="sr-only">
        Search members by name, city, goal, or skill
      </label>
      <div className="search-bar__inner">
        <div className="search-bar__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <input
          ref={inputRef}
          id="member-search"
          type="search"
          className="search-bar__input"
          placeholder="Search by name, city, goal, or skill..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search members"
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button
            className="search-bar__clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
