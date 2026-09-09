import { levelFromXP } from './xp';

/**
 * Stats calculation utilities for GrowLand.
 * Calculated dynamically from users.json — never hardcoded.
 */

/**
 * Calculate total member count.
 */
export function getTotalMembers(members) {
  return members.length;
}

/**
 * Calculate average level across all members.
 */
export function getAverageLevel(members) {
  if (!members.length) return 0;
  const total = members.reduce((sum, m) => sum + levelFromXP(m.xp), 0);
  return (total / members.length).toFixed(1);
}

/**
 * Calculate total XP across all members.
 */
export function getTotalXP(members) {
  return members.reduce((sum, m) => sum + (m.xp || 0), 0);
}

/**
 * Get the most common skill across all members.
 */
export function getTopSkill(members) {
  const skillCount = {};

  members.forEach((m) => {
    if (Array.isArray(m.skills)) {
      m.skills.forEach((s) => {
        if (s.name) {
          skillCount[s.name] = (skillCount[s.name] || 0) + 1;
        }
      });
    }
  });

  if (!Object.keys(skillCount).length) return 'N/A';

  return Object.entries(skillCount).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Get top N members by XP for leaderboard.
 */
export function getTopGrowers(members, n = 3) {
  return [...members]
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, n);
}

/**
 * Get highest level member.
 */
export function getHighestLevelMember(members) {
  if (!members.length) return null;
  return members.reduce((max, m) =>
    levelFromXP(m.xp) > levelFromXP(max.xp) ? m : max
  );
}

/**
 * Build a complete stats object from members array.
 */
export function buildStats(members) {
  return {
    totalMembers: getTotalMembers(members),
    averageLevel: getAverageLevel(members),
    totalXP: getTotalXP(members),
    topSkill: getTopSkill(members),
  };
}
