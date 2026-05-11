import type { Guess } from './types';

const VERSION = 1;
const PREFIX = 'audio-connections:day:';
const CURRENT_DAY_KEY = 'audio-connections:currentDay';

export interface PersistedGameState {
  __v: number;
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
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(day: number, state: Omit<PersistedGameState, '__v'>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key(day), JSON.stringify({ __v: VERSION, ...state }));
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
