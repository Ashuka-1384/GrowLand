/**
 * GrowLand progression engine.
 * XP is the single source of truth; level is always derived from XP.
 */

export const XP_PER_LEVEL = 1000;
export const MIN_XP = 0;
export const MAX_LEVEL = 50;
export const MAX_XP = MAX_LEVEL * XP_PER_LEVEL;

export const QUICK_XP_AMOUNTS = [100, 150, 200, 500, 1000];

export function clampXP(xp) {
  const value = Number(xp);
  if (!Number.isFinite(value)) return MIN_XP;
  return Math.min(Math.max(Math.round(value), MIN_XP), MAX_XP);
}

export function xpForLevel(level) {
  const safeLevel = Math.min(Math.max(Math.floor(Number(level) || 1), 1), MAX_LEVEL);
  return (safeLevel - 1) * XP_PER_LEVEL;
}

export function xpForNextLevel(level) {
  const safeLevel = Math.min(Math.max(Math.floor(Number(level) || 1), 1), MAX_LEVEL);
  return safeLevel >= MAX_LEVEL ? MAX_XP : safeLevel * XP_PER_LEVEL;
}

/** Derive the display level entirely from XP. */
export function levelFromXP(xp) {
  const safeXP = clampXP(xp);
  return Math.min(Math.floor(safeXP / XP_PER_LEVEL) + 1, MAX_LEVEL);
}

export function getLevelProgress(xp) {
  const safeXP = clampXP(xp);
  const level = levelFromXP(safeXP);

  if (level >= MAX_LEVEL) {
    const levelStartXP = xpForLevel(level);
    const progressXP = Math.max(safeXP - levelStartXP, 0);
    const xpNeeded = Math.max(MAX_XP - safeXP, 0);
    return {
      level,
      currentXP: safeXP,
      levelStartXP,
      levelEndXP: MAX_XP,
      progressXP,
      xpNeeded,
      percentage: Math.min(Math.max((progressXP / XP_PER_LEVEL) * 100, 0), 100),
      isMaxLevel: safeXP >= MAX_XP,
    };
  }

  const levelStartXP = xpForLevel(level);
  const levelEndXP = xpForNextLevel(level);
  const progressXP = safeXP - levelStartXP;
  const xpNeeded = Math.max(levelEndXP - safeXP, 0);
  const percentage = Math.min(Math.max((progressXP / XP_PER_LEVEL) * 100, 0), 100);

  return {
    level,
    currentXP: safeXP,
    levelStartXP,
    levelEndXP,
    progressXP,
    xpNeeded,
    percentage,
    isMaxLevel: false,
  };
}

export function xpProgressInLevel(xp, level) {
  // `level` remains accepted for backwards-compatible component APIs,
  // but XP itself is authoritative.
  return getLevelProgress(xp).percentage;
}

export function xpUntilNextLevel(xp, level) {
  return getLevelProgress(xp).xpNeeded;
}

export function formatXPDisplay(xp, level) {
  const progress = getLevelProgress(xp);
  return progress.isMaxLevel
    ? `${progress.currentXP.toLocaleString()} / ${MAX_XP.toLocaleString()} XP`
    : `${progress.currentXP.toLocaleString()} / ${progress.levelEndXP.toLocaleString()} XP`;
}

export function getLevelTier(level) {
  const safeLevel = Number(level) || 0;
  if (safeLevel >= 21) return 'apex';
  if (safeLevel >= 11) return 'elite';
  if (safeLevel >= 6) return 'advanced';
  return 'starter';
}

export function getLevelTierLabel(level) {
  const safeLevel = Number(level) || 0;
  if (safeLevel >= 21) return 'Apex';
  if (safeLevel >= 11) return 'Elite';
  if (safeLevel >= 6) return 'Advanced';
  return 'Starter';
}

export function getNextMilestone(xp) {
  const safeXP = clampXP(xp);
  if (safeXP >= MAX_XP) return MAX_XP;
  const next = Math.ceil((safeXP + 1) / 500) * 500;
  return Math.min(next, MAX_XP);
}

export function normalizeUser(user) {
  const safeXP = clampXP(user?.xp);
  return {
    ...user,
    xp: safeXP,
    level: levelFromXP(safeXP),
  };
}

export function normalizeUsers(users) {
  return Array.isArray(users) ? users.map(normalizeUser) : [];
}
