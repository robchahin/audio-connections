import type { Puzzle } from './types';
import { LAUNCH_EPOCH, resolve, schedule, type PuzzleContent } from './schedule';

class PuzzleSchemaError extends Error {}
const fail = (source: string, msg: string): never => {
  throw new PuzzleSchemaError(`${source}: ${msg}`);
};

/** Soft cap on `Puzzle.constraint` length. The mobile layouts use the
 *  modal (which wraps any length) and the desktop pill sits in a 940px
 *  chrome row, so this isn't strictly a layout guard anymore — it's a
 *  taste guard. The "DJ scribbled note" framing wants a phrase, not a
 *  paragraph. 80 chars ≈ a single sentence and still fits the desktop
 *  pill on one line at 11px mono. */
export const MAX_CONSTRAINT_LENGTH = 80;

export function validatePuzzle(p: unknown, source: string): asserts p is Puzzle {
  if (!p || typeof p !== 'object') fail(source, 'not an object');
  const x = p as Record<string, unknown>;

  if (typeof x.day !== 'number' || !Number.isInteger(x.day) || (x.day as number) < 1) {
    fail(source, 'day must be a positive integer');
  }
  if (typeof x.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.date)) {
    fail(source, 'date must be YYYY-MM-DD');
  }
  if (typeof x.author !== 'string' || x.author.length === 0) {
    fail(source, 'author must be a non-empty string');
  }
  if (typeof x.releaseAt !== 'string' || x.releaseAt.length === 0) {
    fail(source, 'releaseAt must be a non-empty string');
  }
  if (x.constraint !== undefined) {
    if (typeof x.constraint !== 'string' || x.constraint.length === 0) {
      fail(source, 'constraint must be a non-empty string if present');
    }
    const c = x.constraint as string;
    if (c.length > MAX_CONSTRAINT_LENGTH) {
      fail(
        source,
        `constraint is ${c.length} chars; soft cap is ${MAX_CONSTRAINT_LENGTH} — keep it to a phrase, not a sentence`,
      );
    }
  }
  if (!Array.isArray(x.themes) || x.themes.length !== 4) {
    fail(source, 'themes must be an array of exactly 4');
  }

  const themes = x.themes as unknown[];
  for (let i = 0; i < themes.length; i++) {
    const tRaw = themes[i];
    if (!tRaw || typeof tRaw !== 'object') fail(source, `themes[${i}] not an object`);
    const t = tRaw as Record<string, unknown>;

    if (typeof t.theme !== 'string' || t.theme.length === 0) {
      fail(source, `themes[${i}].theme must be a non-empty string`);
    }
    if (!Array.isArray(t.tracks) || t.tracks.length !== 4) {
      fail(source, `themes[${i}].tracks must be an array of exactly 4`);
    }

    const tracks = t.tracks as unknown[];
    for (let j = 0; j < tracks.length; j++) {
      const trRaw = tracks[j];
      if (!trRaw || typeof trRaw !== 'object') fail(source, `themes[${i}].tracks[${j}] not an object`);
      const tr = trRaw as Record<string, unknown>;

      if (typeof tr.id !== 'number') fail(source, `themes[${i}].tracks[${j}].id must be a number`);
      if (typeof tr.artist !== 'string') fail(source, `themes[${i}].tracks[${j}].artist must be a string`);
      if (typeof tr.title !== 'string') fail(source, `themes[${i}].tracks[${j}].title must be a string`);
      if (tr.note !== undefined && typeof tr.note !== 'string') {
        fail(source, `themes[${i}].tracks[${j}].note must be a string if present`);
      }
    }
  }
}

/** Map a puzzle file path to its slug (the file stem). Identity, not number —
 *  `./puzzles/day-34.ts` → `day-34`. */
function slugFromPath(path: string): string {
  const m = /\/([^/]+)\.ts$/.exec(path);
  if (!m) throw new Error(`Unexpected puzzle path: ${path}`);
  return m[1]!;
}

const modules = import.meta.glob<{ default: unknown }>('./puzzles/day-*.ts', { eager: true });

// Build the content map keyed by slug. validatePuzzle still runs (the files
// continue to carry day/date/releaseAt for now), but those fields are no longer
// READ for numbering — resolve() owns number + date. Only the content half is kept.
const contentBySlug = new Map<string, PuzzleContent>();
for (const [path, mod] of Object.entries(modules)) {
  validatePuzzle(mod.default, path);
  const slug = slugFromPath(path);
  if (contentBySlug.has(slug)) throw new Error(`Duplicate puzzle slug "${slug}" (${path})`);
  const p = mod.default;
  contentBySlug.set(slug, { author: p.author, constraint: p.constraint, themes: p.themes });
}

// Every file must be scheduled and vice-versa. Catches a new file nobody added
// to the schedule (it would otherwise be silently invisible); resolve() throws
// for the reverse (a scheduled slug with no file).
const scheduledSlugs = new Set(schedule.map((e) => (typeof e === 'string' ? e : e.slug)));
for (const slug of contentBySlug.keys()) {
  if (!scheduledSlugs.has(slug)) {
    throw new Error(`Puzzle file "${slug}.ts" exists but is not in the schedule (src/schedule.ts)`);
  }
}

// Derive number + date for every scheduled puzzle, then project back onto the
// downstream Puzzle shape so nothing else in the app changes yet.
const resolved = resolve(schedule, contentBySlug, LAUNCH_EPOCH);
export const puzzles: Puzzle[] = resolved.map((r) => ({
  day: r.day,
  date: r.date,
  releaseAt: r.releaseAt,
  author: r.content.author,
  ...(r.content.constraint !== undefined ? { constraint: r.content.constraint } : {}),
  themes: r.content.themes,
}));
export const MAX_MISTAKES = 4;
export const THEME_EMOJI = ['🟨', '🟩', '🟦', '🟪'] as const;

export interface IsReleasedOpts {
  now?: number;
  /** Days unlocked outside the normal release schedule — Konami code and
   *  countdown-driven unlocks both land in this set so callers only need
   *  one predicate. */
  unlocked?: ReadonlySet<number>;
}

export function isReleased(p: Puzzle, opts: IsReleasedOpts = {}): boolean {
  if (opts.unlocked?.has(p.day)) return true;
  return (opts.now ?? Date.now()) >= new Date(p.releaseAt).getTime();
}

export function latestReleasedIndex(opts: IsReleasedOpts = {}): number {
  for (let i = puzzles.length - 1; i >= 0; i--) {
    if (isReleased(puzzles[i]!, opts)) return i;
  }
  return 0;
}
