import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { puzzles } from './puzzles';

// Integrity checks over the puzzle data files. These used to live in
// tests/puzzles.spec.ts under Playwright; they touch no DOM, so they belong in
// the unit suite. Importing `puzzles` here also runs validatePuzzle() against
// every day file as a side effect — these tests pin the same guarantees with
// named, per-day assertions and clearer failure messages.

const puzzleDir = fileURLToPath(new URL('./puzzles', import.meta.url));

describe('every puzzle has the required shape', () => {
  // One case per day so a malformed file fails by name. Stronger than
  // validatePuzzle in puzzles.ts, which only checks artist/title are strings —
  // here they must also be non-empty.
  it.each(puzzles)('day $day — 4 themes, 4 tracks each, required fields', (p) => {
    expect(typeof p.day, 'day').toBe('number');
    expect(p.date, 'date').toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.author.trim().length, 'author is non-empty').toBeGreaterThan(0);

    expect(p.themes, 'exactly 4 themes').toHaveLength(4);
    for (const [i, theme] of p.themes.entries()) {
      expect(theme.theme.trim().length, `theme ${i}: name is non-empty`).toBeGreaterThan(0);
      expect(theme.tracks, `theme ${i}: exactly 4 tracks`).toHaveLength(4);
      for (const [j, track] of theme.tracks.entries()) {
        expect(typeof track.id, `theme ${i} track ${j}: id is a number`).toBe('number');
        expect(track.artist.trim().length, `theme ${i} track ${j}: artist is non-empty`).toBeGreaterThan(0);
        expect(track.title.trim().length, `theme ${i} track ${j}: title is non-empty`).toBeGreaterThan(0);
      }
    }
  });
});

describe('puzzle calendar', () => {
  it('every file in src/puzzles/ matches the day-N.ts naming convention', () => {
    const files = readdirSync(puzzleDir).filter((f) => f !== 'template.ts');
    for (const f of files) {
      expect(f, `unexpected file in src/puzzles/: ${f}`).toMatch(/^day-\d+\.ts$/);
    }
  });

  it('every day-N.ts file is loaded into the puzzles array', () => {
    const files = readdirSync(puzzleDir).filter((f) => /^day-\d+\.ts$/.test(f));
    expect(puzzles.length).toBe(files.length);
  });

  it('each puzzle has a unique day number', () => {
    const days = puzzles.map((p) => p.day);
    expect(new Set(days).size).toBe(days.length);
  });

  // Day numbers are now DERIVED (chronological rank from src/schedule.ts), not
  // read from the filename — the filename is identity, not number. So we no
  // longer assert filename === day; instead we pin the two invariants that
  // derivation guarantees.
  it('day numbers are dense 1..N in load order', () => {
    puzzles.forEach((p, i) => {
      expect(p.day, `puzzle at index ${i}`).toBe(i + 1);
    });
  });

  it('picker order == unlock order: releaseAt never decreases as day increases', () => {
    // The point of deriving the number from the schedule: a later day can never
    // unlock before an earlier one. The old hand-authored scheme let day 34
    // (Jun 30) sit before days 35/36 (Jun 14/15); that inversion is now
    // unrepresentable.
    for (let i = 1; i < puzzles.length; i++) {
      const prev = new Date(puzzles[i - 1]!.releaseAt).getTime();
      const cur = new Date(puzzles[i]!.releaseAt).getTime();
      expect(
        cur,
        `day ${puzzles[i]!.day} releases before day ${puzzles[i - 1]!.day}`,
      ).toBeGreaterThanOrEqual(prev);
    }
  });

  // releaseAt is required by the type and validator, but we still check the
  // value is a parseable date and consistent with `date` — neither of those
  // are enforced by the schema check, and a typo there breaks unlock timing.
  it('every puzzle has a valid releaseAt timestamp matching its date', () => {
    for (const p of puzzles) {
      const ms = new Date(p.releaseAt).getTime();
      expect(
        Number.isNaN(ms),
        `day ${p.day}: releaseAt "${p.releaseAt}" is not a parseable date`,
      ).toBe(false);
      expect(
        p.releaseAt.startsWith(p.date),
        `day ${p.day}: releaseAt "${p.releaseAt}" does not match date "${p.date}"`,
      ).toBe(true);
    }
  });
});

// The iTunes-network check lives in src/puzzles.itunes.test.ts, run via
// `npm run test:itunes` and the dedicated path-filtered GitHub workflow.
