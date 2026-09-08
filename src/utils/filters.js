import { levelFromXP } from './xp';

/**
 * Filter and sort utilities for GrowLand member directory.
 * All logic is decoupled from UI components.
 */

/**
 * Filter members by search query.
 * Searches: name, city, goal, skill names.
 */
export function searchMembers(members, query) {
  if (!query || query.trim() === '') return members;

  const q = query.toLowerCase().trim();

  return members.filter((member) => {
    const nameMatch = member.name?.toLowerCase().includes(q);
    const cityMatch = member.city?.toLowerCase().includes(q);
    const goalMatch = member.goal?.toLowerCase().includes(q);
    const skillMatch = Array.isArray(member.skills)
      ? member.skills.some((s) => s.name?.toLowerCase().includes(q))
      : false;

    return nameMatch || cityMatch || goalMatch || skillMatch;
  });
}

/**
 * Filter members by level range.
 */
export function filterByLevel(members, levelFilter) {
  if (!levelFilter || levelFilter === 'all') return members;

  return members.filter((member) => {
    const level = levelFromXP(member.xp);
    switch (levelFilter) {
      case '1-5':
        return level >= 1 && level <= 5;
      case '6-10':
        return level >= 6 && level <= 10;
      case '11-20':
        return level >= 11 && level <= 20;
      case '21+':
        return level >= 21;
      default:
        return true;
    }
  });
}

/**
 * Filter members by city.
 */
export function filterByCity(members, city) {
  if (!city || city === 'all') return members;
  return members.filter(
    (m) => m.city?.toLowerCase() === city.toLowerCase()
  );
}

/**
 * Filter members by skill name.
 */
export function filterBySkill(members, skill) {
  if (!skill || skill === 'all') return members;
  return members.filter((m) =>
    Array.isArray(m.skills)
      ? m.skills.some((s) => s.name?.toLowerCase() === skill.toLowerCase())
      : false
  );
}

/**
 * Sort members by various criteria.
 */
export function sortMembers(members, sortBy) {
  const sorted = [...members];

  switch (sortBy) {
    case 'level-desc':
      return sorted.sort((a, b) => levelFromXP(b.xp) - levelFromXP(a.xp));
    case 'level-asc':
      return sorted.sort((a, b) => levelFromXP(a.xp) - levelFromXP(b.xp));
    case 'xp-desc':
      return sorted.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    case 'name-asc':
      return sorted.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      );
    default:
      return sorted.sort((a, b) => levelFromXP(b.xp) - levelFromXP(a.xp));
  }
}

/**
 * Apply all filters and sort in sequence.
 */
export function applyFiltersAndSort(members, { query, levelFilter, city, skill, sortBy }) {
  let result = [...members];
  result = searchMembers(result, query);
  result = filterByLevel(result, levelFilter);
  result = filterByCity(result, city);
  result = filterBySkill(result, skill);
  result = sortMembers(result, sortBy);
  return result;
}

/**
 * Extract unique cities from members list.
 */
export function getUniqueCities(members) {
  const cities = members
    .map((m) => m.city)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
  return cities;
}

/**
 * Extract unique skill names from members list.
 */
export function getUniqueSkills(members) {
  const skills = members
    .flatMap((m) => (Array.isArray(m.skills) ? m.skills.map((s) => s.name) : []))
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
  return skills;
}
