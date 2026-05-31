// Node-side puzzle loader for Playwright tests.
//
// The runtime entry `src/puzzles.ts` uses `import.meta.glob`, a Vite-only
// feature the Playwright Node loader doesn't understand, so we can't import it
// here. We reproduce its assembly instead: read the content-only puzzle files
// off disk (since the content-only split they export `PuzzleContent` — no
// day/date/releaseAt), then run them through the same pure `resolve()` the app
// uses so day numbers and release dates are derived identically. Tests see the
// fully-resolved `Puzzle[]`.
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Puzzle, PuzzleContent } from '../../src/types';
import { LAUNCH_EPOCH, idFromSlug, resolve, schedule } from '../../src/schedule';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', '..', 'src', 'puzzles');

// Every puzzle file by stem — `day-N` back-catalogue plus author slugs — minus
// the non-puzzle template. Matches the loader's glob in src/puzzles.ts.
const files = readdirSync(dir)
  .filter((f) => f !== 'template.ts' && f.endsWith('.ts'))
  .sort();

const contentBySlug = new Map<string, PuzzleContent>();
for (const f of files) {
  const slug = f.replace(/\.ts$/, '');
  const mod = (await import(`../../src/puzzles/${f}`)) as { default: PuzzleContent };
  contentBySlug.set(slug, mod.default);
}

// Project resolved puzzles onto the same `Puzzle` shape src/puzzles.ts exports.
// idFromSlug is imported from src/schedule.ts — the same pure function the app
// uses, so save keys are derived identically here (no local mirror to drift).
export const puzzles: Puzzle[] = resolve(schedule, contentBySlug, LAUNCH_EPOCH).map((r) => ({
  id: idFromSlug(r.slug),
  day: r.day,
  date: r.date,
  releaseAt: r.releaseAt,
  author: r.content.author,
  ...(r.content.constraint !== undefined ? { constraint: r.content.constraint } : {}),
  themes: r.content.themes,
}));
