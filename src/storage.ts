import type { Guess } from './types';

const VERSION = 1;
const PREFIX = 'audio-connections:day:';
const CURRENT_DAY_KEY = 'audio-connections:currentDay';
const INTRO_SEEN_KEY = 'audio-connections:introSeen';

export interface PersistedGameState {
  __v: number;
  /** Stable save identity (the puzzle's slug-id). Written by current builds;
   *  optional because saves written before the string-id migration don't carry
   *  it — there `day` served this role, and loadState falls back to
   *  `String(day)` for those. */
  id?: string;
  /** Puzzle day this state belongs to. Kept alongside `id` so a build from
   *  before the migration (e.g. an old tab still open during a deploy) can
   *  still read a save this build wrote — its integrity check keys off `day`.
   *  Also the cross-day-contamination guard. */
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

function key(id: string): string {
  return `${PREFIX}${id}`;
}

/** Identity a persisted record claims. Prefers the explicit `id`; falls back to
 *  the numeric `day` for records written before the string-id migration. For a
 *  legacy `day-N` puzzle the id IS `String(day)`, so a pre-migration save and a
 *  current one resolve to the same identity and the same key.
 *
 *  Retiring the `?? String(...day)` shim: this fallback (and its mirrors in
 *  dayState.ts, backup.ts and hooks/usePuzzleSession.ts) exists only to keep
 *  reading saves written before the string-id migration. To drop it, make `id`
 *  required on PersistedGameState — the compiler then points at every fallback
 *  site to delete. Note this is a DELETION, not a no-op: any save not rewritten
 *  since before the migration (no `id` field) becomes unreadable, so only do it
 *  once you're willing to discard those. The `day` dual-write in saveState is
 *  NOT part of this shim — it stays permanently (it's free, and doubles as a
 *  debug aid and the cross-day-contamination guard below). */
function savedId(parsed: PersistedGameState): string {
  return parsed.id ?? String(parsed.day);
}

export function loadState(id: string): PersistedGameState | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedGameState;
    if (parsed.__v !== VERSION) return null;
    // Reject stale entries whose identity doesn't match the slot — catches a
    // cross-day write (an older build saving Day N-1's state into Day N's slot).
    if (savedId(parsed) !== id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist a day's state. `id` is the save key (stable slug-id); `day` is the
 *  display number, written for back-compat so a pre-migration build can still
 *  read this record. */
export function saveState(
  id: string,
  day: number,
  state: Omit<PersistedGameState, '__v' | 'id' | 'day'>,
): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key(id), JSON.stringify({ __v: VERSION, id, day, ...state }));
  } catch {
    /* quota or disabled storage — ignore */
  }
}

export function clearState(id: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key(id));
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
