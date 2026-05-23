import type { Guess } from './types';

const VERSION = 1;
const PREFIX = 'audio-connections:day:';
const CURRENT_DAY_KEY = 'audio-connections:currentDay';
const INTRO_SEEN_KEY = 'audio-connections:introSeen';

export interface PersistedGameState {
  __v: number;
  /** Puzzle day this state belongs to. Defensive check against
      cross-day contamination if save fires with a mismatched key. */
  day: number;
  selected: number[];
  solvedThemes: number[];
  notes: Array<[number, string]>;
  mistakes: number;
  guessHistory: Guess[];
  gameOver: boolean;
  /** Track ids in display order so the shuffle survives across reloads. */
  trackOrder: number[];
  /** Guess signatures (sorted comma-joined ids) so duplicate guesses dedup after reload. */
  guessSignatures: string[];
}

function key(day: number): string {
  return `${PREFIX}${day}`;
}

export function loadState(day: number): PersistedGameState | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key(day));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedGameState;
    if (parsed.__v !== VERSION) return null;
    // Reject stale entries whose day field doesn't match the slot. This
    // catches cross-day writes (e.g. older builds saved Day N-1's state
    // into Day N's slot).
    if (parsed.day !== day) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(day: number, state: Omit<PersistedGameState, '__v' | 'day'>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key(day), JSON.stringify({ __v: VERSION, day, ...state }));
  } catch {
    /* quota or disabled storage — ignore */
  }
}

export function clearState(day: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key(day));
  } catch {
    /* ignore */
  }
}

export function loadCurrentDay(): number | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_DAY_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function saveCurrentDay(day: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_DAY_KEY, String(day));
  } catch {
    /* ignore */
  }
}

/** Highest intro-card version the user has acknowledged.
 *  Returns -1 when they've never seen the intro (so any current version
 *  > -1 shows it), and POSITIVE_INFINITY when localStorage is unreadable
 *  (so version comparisons treat the user as already-seen and the intro
 *  stays hidden — defensive choice, matches the prior boolean behavior). */
export function loadIntroSeenVersion(): number {
  if (typeof localStorage === 'undefined') return Number.POSITIVE_INFINITY;
  try {
    const raw = localStorage.getItem(INTRO_SEEN_KEY);
    if (raw === null) return -1;
    const n = Number(raw);
    return Number.isFinite(n) ? n : -1;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function saveIntroSeenVersion(version: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(INTRO_SEEN_KEY, String(version));
  } catch {
    /* ignore */
  }
}
