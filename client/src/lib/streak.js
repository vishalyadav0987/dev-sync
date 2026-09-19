const KEY = "dsa_streak";

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, local-independent enough for this use case
}

function daysBetween(a, b) {
  const MS_PER_DAY = 86_400_000;
  return Math.round((new Date(b) - new Date(a)) / MS_PER_DAY);
}

/**
 * Pure function: given the previously stored streak state, returns the
 * next state for "today". Kept separate from localStorage I/O so it's
 * trivially unit-testable.
 */
export function computeNextStreak(prev, today = todayISO()) {
  if (!prev || !prev.lastVisit) {
    return { count: 1, lastVisit: today, longest: 1 };
  }

  const diff = daysBetween(prev.lastVisit, today);

  if (diff === 0) return prev; // already visited today, no-op
  if (diff === 1) {
    const count = prev.count + 1;
    return { count, lastVisit: today, longest: Math.max(count, prev.longest || 0) };
  }
  // diff > 1 (gap) or diff < 0 (clock skew) — streak resets
  return { count: 1, lastVisit: today, longest: prev.longest || 1 };
}

/** Reads localStorage, applies today's visit, persists, and returns the result. */
export function recordVisitAndGetStreak() {
  let prev = null;
  try {
    prev = JSON.parse(localStorage.getItem(KEY));
  } catch {
    prev = null;
  }

  const next = computeNextStreak(prev);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
