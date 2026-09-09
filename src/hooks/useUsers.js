import { useCallback, useEffect, useState } from 'react';
import usersData from '../data/users.json';
import { clampXP, levelFromXP, normalizeUsers } from '../utils/xp';

const USERS_STORAGE_KEY = 'growland-users-v3';
const HISTORY_STORAGE_KEY = 'growland-xp-history-v1';
const MAX_HISTORY_ITEMS = 100;
const DATA_VERSION = Number(usersData.version || 1);

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence can fail in restricted/private browsing contexts.
  }
}

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!usersData || !Array.isArray(usersData.users)) {
          throw new Error('Invalid data structure in users.json');
        }

        const stored = readStorage(USERS_STORAGE_KEY, null);
        const storedHistory = readStorage(HISTORY_STORAGE_KEY, []);
        const hasCurrentVersion = stored && stored.version === DATA_VERSION && Array.isArray(stored.users);
        const source = hasCurrentVersion ? stored.users : usersData.users;

        setUsers(normalizeUsers(source));
        setHistory(hasCurrentVersion && Array.isArray(storedHistory) ? storedHistory : []);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load growth data.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateUserXP = useCallback((userId, delta, reason = 'Admin XP adjustment') => {
    const numericDelta = Number(delta);
    if (!Number.isFinite(numericDelta) || numericDelta === 0) {
      return { ok: false, error: 'XP change must be a non-zero number.' };
    }

    const currentUser = users.find((user) => user.id === userId);
    if (!currentUser) return { ok: false, error: 'Member not found.' };

    const oldXP = clampXP(currentUser.xp);
    const oldLevel = levelFromXP(oldXP);
    const newXP = clampXP(oldXP + numericDelta);
    const appliedDelta = newXP - oldXP;

    if (appliedDelta === 0) {
      return {
        ok: false,
        error: numericDelta > 0 ? 'Member is already at the XP cap.' : 'Member is already at 0 XP.',
      };
    }

    const newLevel = levelFromXP(newXP);
    const updatedUser = { ...currentUser, xp: newXP, level: newLevel };
    const nextUsers = users.map((user) => (user.id === userId ? updatedUser : user));
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      delta: appliedDelta,
      fromXP: oldXP,
      toXP: newXP,
      levelBefore: oldLevel,
      levelAfter: newLevel,
      levelChanged: oldLevel !== newLevel,
      reason,
      createdAt: new Date().toISOString(),
    };

    setUsers(nextUsers);
    writeStorage(USERS_STORAGE_KEY, { version: DATA_VERSION, users: nextUsers });
    setHistory((currentHistory) => {
      const nextHistory = [entry, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
      writeStorage(HISTORY_STORAGE_KEY, nextHistory);
      return nextHistory;
    });

    return { ok: true, user: updatedUser, entry };
  }, [users]);

  const getUserHistory = useCallback(
    (userId, limit = 8) => history.filter((entry) => entry.userId === userId).slice(0, limit),
    [history]
  );

  const resetUsers = useCallback(() => {
    const baseline = normalizeUsers(usersData.users);
    setUsers(baseline);
    setHistory([]);
    writeStorage(USERS_STORAGE_KEY, { version: DATA_VERSION, users: baseline });
    writeStorage(HISTORY_STORAGE_KEY, []);
    return baseline;
  }, []);

  return {
    users,
    loading,
    error,
    updateUserXP,
    getUserHistory,
    resetUsers,
  };
}
