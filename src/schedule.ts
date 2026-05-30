/** The maintainer-owned puzzle schedule and the pure resolver that turns it
 *  into dated, numbered puzzles.
 *
 *  Design: see docs/adr/0001-derived-day-scheduling.md. The short version —
 *  puzzle *files* carry content only; this list is the single place that
 *  decides ORDER. Day numbers and release dates are DERIVED here, never
 *  authored in puzzle files. `resolve()` is pure (no wall-clock, no I/O) so it
 *  reproduces identically on every build and is exhaustively unit-testable.
 *
 *  This module is intentionally not yet wired into the app loader (that is a
 *  later PR). It can be exercised in isolation via its tests and the eventual
 *  `schedule:preview` script.
 */
import type { Theme } from './types';

/** Date of day 1 — the anchor every auto-assigned date counts from. */
export const LAUNCH_EPOCH = '2026-05-10';

/** A schedule slot. A bare string auto-dates (previous slot's date + 1 day);
 *  the object form pins a specific calendar date (rare — honoured out-of-band
 *  date requests, or the resume date after a deliberate pause). */
export type ScheduleEntry = string | { slug: string; date: string };

/** The content half of a puzzle — everything a puzzle FILE owns. The number,
 *  date and releaseAt that used to live alongside these are derived by
 *  `resolve()` instead. (Lives here for now; moves to types.ts when the loader
 *  is reworked to read content-only files.) */
export interface PuzzleContent {
  author: string;
  constraint?: string;
  themes: Theme[];
}

/** A puzzle once the schedule has given it a position in time. */
export interface ResolvedPuzzle {
  /** Stable identity / save key (the file's slug). */
  slug: string;
  /** Derived display number — chronological rank, 1-based. */
  day: number;
  /** Derived calendar date, YYYY-MM-DD. */
  date: string;
  /** Derived ISO release timestamp (midnight UTC of `date`). */
  releaseAt: string;
  content: PuzzleContent;
}

/** Normalize either ScheduleEntry form to `{ slug, pinnedDate? }`. */
function entrySlug(e: ScheduleEntry): string {
  return typeof e === 'string' ? e : e.slug;
}
function entryPinned(e: ScheduleEntry): string | undefined {
  return typeof e === 'string' ? undefined : e.date;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse a YYYY-MM-DD date as a UTC day-count (days since the unix epoch).
 *  Working in integer day-counts keeps all the arithmetic exact and free of
 *  timezone/DST drift — we never touch local time. */
function toDayNumber(date: string): number {
  if (!DATE_RE.test(date)) throw new Error(`Invalid schedule date "${date}" (want YYYY-MM-DD)`);
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const ms = Date.UTC(y, m - 1, d);
  const n = Math.floor(ms / 86_400_000);
  // Round-trip guard: rejects impossible calendar dates like 2026-02-30 that
  // Date.UTC silently rolls over rather than failing on.
  if (fromDayNumber(n) !== date) throw new Error(`Invalid calendar date "${date}"`);
  return n;
}

function fromDayNumber(n: number): string {
  const ms = n * 86_400_000;
  const dt = new Date(ms);
  const y = dt.getUTCFullYear().toString().padStart(4, '0');
  const m = (dt.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = dt.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Resolve a schedule + the available puzzle content into dated, numbered
 *  puzzles. Pure: identical inputs always give identical output.
 *
 *  Rules (see ADR):
 *   1. Pinned dates are reserved up front.
 *   2. Walking the list, a bare entry takes `previousDate + 1 day`, advancing
 *      past any reserved pin date so an auto entry never lands on a pin.
 *   3. The day number is the rank by (resolved date, then list index) — the
 *      list-index tiebreak both makes ordering total and lets two puzzles
 *      deliberately share a date (consecutive numbers, one releaseAt).
 *
 *  Throws on: a scheduled slug with no content; a malformed/impossible date;
 *  an auto entry colliding with another entry's date (only possible when a pin
 *  re-anchors the cursor backwards — the fix is to reorder, so we surface it
 *  rather than silently double-book a number).
 */
export function resolve(
  schedule: readonly ScheduleEntry[],
  contentBySlug: ReadonlyMap<string, PuzzleContent>,
  epoch: string = LAUNCH_EPOCH,
): ResolvedPuzzle[] {
  const epochN = toDayNumber(epoch);

  // Pass 1: reserve every pinned date.
  const reserved = new Set<number>();
  for (const e of schedule) {
    const pin = entryPinned(e);
    if (pin !== undefined) reserved.add(toDayNumber(pin));
  }

  // Pass 2: assign each entry a date in list order.
  interface Assigned {
    slug: string;
    dateN: number;
    index: number;
    pinned: boolean;
  }
  const assigned: Assigned[] = [];
  const seenSlugs = new Set<string>();
  let prev: number | null = null;

  schedule.forEach((e, index) => {
    const slug = entrySlug(e);
    if (seenSlugs.has(slug)) {
      throw new Error(`Schedule lists slug "${slug}" more than once`);
    }
    seenSlugs.add(slug);

    const pin = entryPinned(e);
    let dateN: number;
    if (pin !== undefined) {
      dateN = toDayNumber(pin);
    } else {
      let candidate = prev === null ? epochN : prev + 1;
      while (reserved.has(candidate)) candidate++;
      dateN = candidate;
    }
    assigned.push({ slug, dateN, index, pinned: pin !== undefined });
    prev = dateN;
  });

  // Collision guard: an *auto* entry must not share a date with any other
  // entry. (Pinned entries may deliberately share a date — that is two-per-day.)
  const byDate = new Map<number, Assigned[]>();
  for (const a of assigned) {
    const list = byDate.get(a.dateN) ?? [];
    list.push(a);
    byDate.set(a.dateN, list);
  }
  for (const [dateN, list] of byDate) {
    if (list.length > 1 && list.some((a) => !a.pinned)) {
      const slugs = list.map((a) => a.slug).join(', ');
      throw new Error(
        `Auto-dating collided on ${fromDayNumber(dateN)} (${slugs}). A pin re-anchored ` +
          `the sequence onto an already-used day — reorder the schedule or pin the conflicting entry.`,
      );
    }
  }

  // Number by (date, list index). Stable, total, and two-per-day-friendly.
  const ranked = [...assigned].sort((a, b) =>
    a.dateN !== b.dateN ? a.dateN - b.dateN : a.index - b.index,
  );

  return ranked.map((a, i) => {
    const content = contentBySlug.get(a.slug);
    if (!content) {
      throw new Error(`Scheduled slug "${a.slug}" has no puzzle file/content`);
    }
    const date = fromDayNumber(a.dateN);
    return {
      slug: a.slug,
      day: i + 1,
      date,
      releaseAt: `${date}T00:00:00Z`,
      content,
    };
  });
}

/** The live schedule.
 *
 *  PR1 seed: the legacy day-N ids in their current numeric order, as a
 *  placeholder so the module type-checks and the resolver has something real to
 *  chew on. The tangle fix (reorder 34/35/36, pin the held date) and the cutover
 *  to author slugs land in a later PR; until the loader is wired this array is
 *  not yet the source of truth for the running app. */
/** The live schedule — the single source of truth for ORDER. The loader
 *  (puzzles.ts) feeds this to resolve() to derive each puzzle's number and
 *  date; the puzzle FILES no longer decide either (their still-embedded
 *  day/date/releaseAt are vestigial until the content-only PR strips them).
 *
 *  Slugs are the file stems in src/puzzles/ (currently `day-N`). Identity is
 *  the stem, not the number — a file keeps the name `day-34` while resolving
 *  to a different display number.
 *
 *  Dates auto-flow as previous + 1 day from LAUNCH_EPOCH, so a contiguous run
 *  needs no dates at all. The only pin is the held Jun-30 date for `day-34`;
 *  listing it LAST means its derived number (rank by date) also comes last,
 *  and the old day-34/35/36 inversion is unrepresentable. New puzzles append
 *  as bare entries. */
export const schedule: ScheduleEntry[] = [
  'day-1', 'day-2', 'day-3', 'day-4', 'day-5', 'day-6', 'day-7', 'day-8',
  'day-9', 'day-10', 'day-11', 'day-12', 'day-13', 'day-14', 'day-15', 'day-16',
  'day-17', 'day-18', 'day-19', 'day-20', 'day-21', 'day-22', 'day-23', 'day-24',
  'day-25', 'day-26', 'day-27', 'day-28', 'day-29', 'day-30', 'day-31', 'day-32',
  'day-33', 'day-35', 'day-36',
  { slug: 'day-34', date: '2026-06-30' }, // held date — de-tangles the tail
];
