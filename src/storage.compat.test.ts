import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadState, saveState, type PersistedGameState } from './storage';
import { decodeBackup } from './transfer';

// Back-compat fixtures captured from a real pre-migration (numeric-key) build.
// These are the regression guard for the string-id migration: a save written
// by the old build must still load identically under the new code, and an old
// build must still be able to read what the new code writes.
const lsFixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('./__fixtures__/legacy-localstorage.json', import.meta.url)), 'utf8'),
) as Record<string, string>;
const backupFixture = readFileSync(
  fileURLToPath(new URL('./__fixtures__/legacy-backup.txt', import.meta.url)),
  'utf8',
).trim();

/** Seed the in-memory localStorage with the captured legacy dump verbatim. */
function seedLegacy(): void {
  localStorage.clear();
  for (const [k, v] of Object.entries(lsFixture)) localStorage.setItem(k, v);
}

describe('legacy localStorage loads unchanged under the string-id key', () => {
  beforeEach(seedLegacy);

  // The four states the fixture was built to cover. loadState keys off the
  // bare number string — identical to the legacy key — and the legacy payloads
  // have no `id` field, so this also exercises the savedId() fallback to
  // String(day).
  it.each([
    ['14', { gameOver: true, mistakes: 0, solvedLen: 4 }], // done
    ['21', { gameOver: true, mistakes: 1, solvedLen: 4 }], // doneMistakes
    ['1', { gameOver: true, mistakes: 4, solvedLen: 4 }], // failed
    ['12', { gameOver: false, mistakes: 0, solvedLen: 1 }], // inProgress
  ] as const)('day %s loads with the expected terminal/progress shape', (id, want) => {
    const s = loadState(id);
    expect(s, `day ${id} should load`).not.toBeNull();
    expect(s!.gameOver).toBe(want.gameOver);
    expect(s!.mistakes).toBe(want.mistakes);
    expect(s!.solvedThemes).toHaveLength(want.solvedLen);
    // Legacy payloads carry no id; the day field still backs identity.
    expect(s!.id).toBeUndefined();
    expect(s!.day).toBe(Number(id));
  });

  it('resumes the in-progress day (day 12): solved group + shuffle preserved', () => {
    const s = loadState('12')!;
    expect(s.gameOver).toBe(false);
    expect(s.solvedThemes).toEqual([3]);
    expect(s.trackOrder).toHaveLength(16);
    // The one solved guess is intact for replay/dedup.
    expect(s.guessHistory).toHaveLength(1);
    expect(s.guessSignatures).toEqual(['12,13,14,15']);
  });

  it('keys are byte-identical: a legacy day reads from the same string key', () => {
    // The new code must not have changed the on-disk key for a day-N puzzle.
    expect(localStorage.getItem('audio-connections:day:21')).not.toBeNull();
    expect(loadState('21')).not.toBeNull();
  });
});

describe('forward-compat: a save the new code writes is readable by old code', () => {
  beforeEach(() => localStorage.clear());

  it('persists both id and a numeric day field', () => {
    const body: Omit<PersistedGameState, '__v' | 'id' | 'day'> = {
      selected: [],
      solvedThemes: [0, 1, 2, 3],
      notes: [],
      mistakes: 0,
      guessHistory: [],
      gameOver: true,
      trackOrder: Array.from({ length: 16 }, (_, i) => i),
      guessSignatures: [],
    };
    saveState('21', 21, body);
    const raw = JSON.parse(localStorage.getItem('audio-connections:day:21')!) as PersistedGameState;
    // New field for current code…
    expect(raw.id).toBe('21');
    // …and the legacy field an old tab's integrity check (`parsed.day === N`)
    // still relies on. This is what keeps a stale tab from blanking the save
    // during the deploy window.
    expect(raw.day).toBe(21);
  });
});

describe('legacy backup envelope still imports after the migration', () => {
  it('decodes a formatVersion-1 (numeric-day) backup into its three terminal days', () => {
    const res = decodeBackup(backupFixture);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.envelope.formatVersion).toBe(1);
    expect(res.envelope.days.map((d) => d.day).sort((a, b) => a - b)).toEqual([1, 14, 21]);
    // In-progress day 12 was correctly excluded from the export.
    expect(res.envelope.days.some((d) => d.day === 12)).toBe(false);
  });
});
