import { describe, expect, it } from 'vitest';
import {
  LAUNCH_EPOCH,
  idFromSlug,
  resolve,
  schedule as liveSchedule,
  type PuzzleContent,
  type ScheduleEntry,
} from './schedule';

/** Minimal valid content; resolve() only cares that the slug maps to *something*. */
function content(author = 'test'): PuzzleContent {
  return { author, themes: [] };
}

/** Build a content map covering every slug a schedule references. */
function contentFor(schedule: ScheduleEntry[]): Map<string, PuzzleContent> {
  const m = new Map<string, PuzzleContent>();
  for (const e of schedule) {
    const slug = typeof e === 'string' ? e : e.slug;
    m.set(slug, content(slug));
  }
  return m;
}

function run(schedule: ScheduleEntry[], epoch?: string) {
  return resolve(schedule, contentFor(schedule), epoch);
}

describe('resolve — basic auto-dating', () => {
  it('dates the first entry on the epoch and counts up by one day', () => {
    const out = run(['a', 'b', 'c'], '2026-05-10');
    expect(out.map((p) => [p.slug, p.day, p.date])).toEqual([
      ['a', 1, '2026-05-10'],
      ['b', 2, '2026-05-11'],
      ['c', 3, '2026-05-12'],
    ]);
  });

  it('derives releaseAt as midnight UTC of the date', () => {
    const [p] = run(['a'], '2026-05-10');
    expect(p!.releaseAt).toBe('2026-05-10T00:00:00Z');
  });

  it('crosses a month boundary correctly', () => {
    const out = run(['a', 'b', 'c'], '2026-05-30');
    expect(out.map((p) => p.date)).toEqual(['2026-05-30', '2026-05-31', '2026-06-01']);
  });

  it('defaults to LAUNCH_EPOCH when no epoch is given', () => {
    const [p] = run(['a']);
    expect(p!.date).toBe(LAUNCH_EPOCH);
  });
});

describe('resolve — pins', () => {
  it('honours an explicit pinned date', () => {
    const out = run(['a', { slug: 'b', date: '2026-06-30' }], '2026-05-10');
    expect(out.find((p) => p.slug === 'b')!.date).toBe('2026-06-30');
  });

  it('re-anchors subsequent auto entries to pinned + 1', () => {
    const out = run(['a', { slug: 'b', date: '2026-06-30' }, 'c'], '2026-05-10');
    expect(out.find((p) => p.slug === 'c')!.date).toBe('2026-07-01');
  });

  it('auto entries skip a reserved pin date that falls in their path', () => {
    // a=May10, b would be May11 but May11 is pinned to c → b jumps to May12.
    const out = run(['a', 'b', { slug: 'c', date: '2026-05-11' }], '2026-05-10');
    const bySlug = Object.fromEntries(out.map((p) => [p.slug, p.date]));
    expect(bySlug).toMatchObject({ a: '2026-05-10', c: '2026-05-11', b: '2026-05-12' });
  });

  it('a held late date listed last is numbered last (the worked-example shape)', () => {
    // Maintainer contract: list in roughly chronological order. Autos that
    // should precede a held date go *before* the pin in the list, so the
    // cursor flows from the epoch and the pin lands at the end.
    const out = run(['x', 'y', { slug: 'held', date: '2026-06-30' }], '2026-06-14');
    expect(out.map((p) => [p.slug, p.day, p.date])).toEqual([
      ['x', 1, '2026-06-14'],
      ['y', 2, '2026-06-15'],
      ['held', 3, '2026-06-30'],
    ]);
  });

  it('numbers by date rank, not list order, when a pin is dated before its predecessors', () => {
    // 'early' is listed THIRD but pinned to a date before x/y → it ranks first.
    // This is the property that makes picker-order == unlock-order by
    // construction: the number is the date rank regardless of authoring order.
    const out = run(['x', 'y', { slug: 'early', date: '2026-06-14' }], '2026-06-20');
    expect(out.map((p) => [p.slug, p.day, p.date])).toEqual([
      ['early', 1, '2026-06-14'],
      ['x', 2, '2026-06-20'],
      ['y', 3, '2026-06-21'],
    ]);
  });
});

describe('resolve — pauses (gaps in the calendar, not in numbers)', () => {
  it('expresses a multi-day pause via a pinned resume date; numbers stay dense', () => {
    const out = run(['a', 'b', { slug: 'c', date: '2026-06-11' }], '2026-06-08');
    // a Jun8, b Jun9, [Jun10 skipped], c Jun11 — numbers 1,2,3 (no skipped number).
    expect(out.map((p) => [p.slug, p.day, p.date])).toEqual([
      ['a', 1, '2026-06-08'],
      ['b', 2, '2026-06-09'],
      ['c', 3, '2026-06-11'],
    ]);
  });
});

describe('resolve — two puzzles on one day', () => {
  // Deliberate doubling-up is expressed by PINNING both entries to the same
  // date. An auto entry can't be used for this — it always skips a reserved
  // date (see the test below), which is what stops an auto entry silently
  // colliding with a pin.
  it('gives two entries pinned to one date consecutive numbers and one releaseAt', () => {
    const out = run(
      [{ slug: 'b', date: '2026-06-20' }, { slug: 'c', date: '2026-06-20' }, 'd'],
      '2026-06-20',
    );
    expect(out.map((p) => [p.slug, p.day, p.date])).toEqual([
      ['b', 1, '2026-06-20'],
      ['c', 2, '2026-06-20'],
      ['d', 3, '2026-06-21'], // auto resumes from the shared date + 1
    ]);
    expect(out[0]!.releaseAt).toBe(out[1]!.releaseAt);
  });

  it('an auto entry never shares a day with a pin — it skips onto the next free date', () => {
    // a is auto and would want the epoch (Jun20), but Jun20 is pinned to b,
    // so a is pushed to the next free day rather than doubling up by accident.
    const out = run(['a', { slug: 'b', date: '2026-06-20' }], '2026-06-20');
    const bySlug = Object.fromEntries(out.map((p) => [p.slug, p.date]));
    expect(bySlug).toEqual({ b: '2026-06-20', a: '2026-06-21' });
  });
});

describe('resolve — errors', () => {
  it('throws when a scheduled slug has no content', () => {
    expect(() => resolve(['ghost'], new Map(), '2026-05-10')).toThrow(/no puzzle file\/content/);
  });

  it('throws on a duplicate slug in the schedule', () => {
    expect(() => run(['a', 'a'], '2026-05-10')).toThrow(/more than once/);
  });

  it('throws on a malformed date', () => {
    expect(() => run([{ slug: 'a', date: '2026/05/10' }])).toThrow(/Invalid schedule date/);
  });

  it('throws on an impossible calendar date', () => {
    expect(() => run([{ slug: 'a', date: '2026-02-30' }])).toThrow(/Invalid calendar date/);
  });

  it('throws when a backward pin makes two auto entries collide', () => {
    // epoch May10: a wants May10, but May10 is pinned to b → a jumps to May11.
    // c then auto-dates from b(May10)+1 = May11 → collides with a.
    expect(() => run(['a', { slug: 'b', date: '2026-05-10' }, 'c'], '2026-05-10')).toThrow(
      /collided/,
    );
  });
});

describe('resolve — golden master (frozen released prefix)', () => {
  // The released back-catalogue (days 1..20) is contiguous, one-per-day, from
  // the launch epoch. resolve() MUST reproduce these dates and numbers exactly,
  // or the cutover would shift a live puzzle's number and orphan its saves.
  // This is the safety net the ADR's "frozen released prefix" CI check guards.
  it('reproduces days 1..20 as 2026-05-10 .. 2026-05-29', () => {
    const slugs = Array.from({ length: 20 }, (_, i) => `day-${i + 1}`);
    const out = run(slugs, LAUNCH_EPOCH);
    expect(out).toHaveLength(20);
    out.forEach((p, i) => {
      expect(p.day).toBe(i + 1);
      expect(p.slug).toBe(`day-${i + 1}`);
    });
    expect(out[0]!.date).toBe('2026-05-10');
    expect(out[19]!.date).toBe('2026-05-29');
  });

  it('preserves content identity through resolution', () => {
    const map = new Map<string, PuzzleContent>([['day-1', content('Corey Farwell')]]);
    const [p] = resolve(['day-1'], map, LAUNCH_EPOCH);
    expect(p!.content.author).toBe('Corey Farwell');
  });
});

describe('the live schedule resolves the current catalogue correctly', () => {
  // Resolve the REAL schedule against synthetic content (one stub per scheduled
  // slug) so this pins the schedule's number/date output independent of puzzle
  // file contents. It is the migration's source of truth for what each file
  // resolves to.
  const stub = new Map<string, PuzzleContent>(
    liveSchedule.map((e) => {
      const slug = typeof e === 'string' ? e : e.slug;
      return [slug, content(slug)] as const;
    }),
  );
  const out = resolve(liveSchedule, stub, LAUNCH_EPOCH);

  it('covers all 36 catalogue days, dense 1..36, chronological', () => {
    expect(out).toHaveLength(36);
    out.forEach((p, i) => expect(p.day).toBe(i + 1));
    for (let i = 1; i < out.length; i++) {
      expect(out[i]!.date >= out[i - 1]!.date).toBe(true);
    }
  });

  // Frozen save-key snapshot — the orphaned-saves guard. A puzzle's SAVE KEY is
  // idFromSlug(slug), and it must NEVER change once players can have saved under
  // it. Days 1..22 are released `day-N` files whose keys are the bare numbers
  // '1'..'22' that live saves sit under, so their files must never be renamed.
  // The reslugged tail (days 23..36, PR5) freezes each author slug as its now-
  // permanent key. Renaming any file, reordering the schedule, or shifting a pin
  // breaks this table loudly. Columns: [day, slug, saveKey, date].
  const FROZEN: ReadonlyArray<readonly [number, string, string, string]> = [
    ...Array.from({ length: 22 }, (_, i): readonly [number, string, string, string] => {
      const n = i + 1;
      const date = new Date(Date.UTC(2026, 4, 10) + i * 86_400_000).toISOString().slice(0, 10);
      return [n, `day-${n}`, String(n), date];
    }),
    [23, 'bojanrajkovic-1', 'bojanrajkovic-1', '2026-06-01'],
    [24, 'klobucar-1', 'klobucar-1', '2026-06-02'],
    [25, 'farana-1', 'farana-1', '2026-06-03'],
    [26, 'rob-tetrel-1', 'rob-tetrel-1', '2026-06-04'],
    [27, 'robchahin-1', 'robchahin-1', '2026-06-05'],
    [28, 'klobucar-2', 'klobucar-2', '2026-06-06'],
    [29, 'gitblight1-1', 'gitblight1-1', '2026-06-07'],
    [30, 'rob-tetrel-2', 'rob-tetrel-2', '2026-06-08'],
    [31, 'bojanrajkovic-2', 'bojanrajkovic-2', '2026-06-09'],
    [32, 'klobucar-3', 'klobucar-3', '2026-06-10'],
    [33, 'farana-2', 'farana-2', '2026-06-11'],
    [34, 'farana-3', 'farana-3', '2026-06-12'], // file day-35 → #34
    [35, 'tqbf-1', 'tqbf-1', '2026-06-13'], // file day-36 → #35
    [36, 'tqbf-2', 'tqbf-2', '2026-06-30'], // file day-34 → #36 (held)
  ];

  it('matches the frozen save-key snapshot (day, slug, save key, date)', () => {
    expect(out.map((p) => [p.day, p.slug, idFromSlug(p.slug), p.date])).toEqual(
      FROZEN.map((r) => [...r]),
    );
  });

  it('every released day (1..22) keeps a stable numeric save key', () => {
    for (const [day, slug] of FROZEN) {
      if (day <= 22) {
        expect([slug, idFromSlug(slug)], `released day ${day}`).toEqual([`day-${day}`, String(day)]);
      }
    }
  });
});

describe('idFromSlug', () => {
  it('collapses a legacy day-N slug to the bare number (live save key)', () => {
    expect(idFromSlug('day-1')).toBe('1');
    expect(idFromSlug('day-22')).toBe('22');
    expect(idFromSlug('day-100')).toBe('100');
  });

  it('uses an author slug verbatim as its own id', () => {
    expect(idFromSlug('tqbf-1')).toBe('tqbf-1');
    expect(idFromSlug('rob-tetrel-2')).toBe('rob-tetrel-2');
    expect(idFromSlug('bojanrajkovic-1')).toBe('bojanrajkovic-1');
  });

  it('only collapses an EXACT ^day-N$ match, never a handle that starts with "day"', () => {
    expect(idFromSlug('day-1-extra')).toBe('day-1-extra');
    expect(idFromSlug('dayton-3')).toBe('dayton-3');
    expect(idFromSlug('day-')).toBe('day-');
  });
});
