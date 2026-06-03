// schedule:preview — print the resolved schedule as a dated, numbered table
// plus maintainer warnings (thin runway, calendar gaps, a run-dry queue).
//
// The schedule file lists only slugs in order; this is how a maintainer SEES
// what those resolve to — each puzzle's day number and release date — without
// reverse-engineering them from the epoch + list position. Read-only.
//
// Runs on plain Node via native TS type-stripping (no tsx). The analysis it
// renders, previewWarnings(), is pure and unit-tested in src/schedule.test.ts;
// this wrapper just supplies the clock and formats the output.
//   node scripts/schedule-preview.ts
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  findBacklogSlugs,
  previewWarnings,
  resolve as resolveSchedule,
  schedule,
  type PuzzleContent,
  type ScheduleEntry,
} from '../src/schedule.ts';

const TODAY = new Date().toISOString().slice(0, 10); // UTC, matches schedule dates
const PUZZLE_FILE_RE = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*\.ts$/;
const BACKLOG_ONLY = process.argv.includes('--backlog-only');

function stubContent(s: readonly ScheduleEntry[]): Map<string, PuzzleContent> {
  const m = new Map<string, PuzzleContent>();
  for (const e of s) m.set(typeof e === 'string' ? e : e.slug, { author: 'stub', themes: [] });
  return m;
}

function puzzleFileSlugs(): string[] {
  const dir = fileURLToPath(new URL('../src/puzzles', import.meta.url));
  return readdirSync(dir)
    .filter((f) => f !== 'template.ts' && PUZZLE_FILE_RE.test(f))
    .map((f) => f.replace(/\.ts$/, ''));
}

const resolved = resolveSchedule(schedule, stubContent(schedule));
const backlog = findBacklogSlugs(puzzleFileSlugs(), schedule);

function printBacklog(): void {
  if (backlog.length === 0) {
    console.log(`\nBacklog — none\n`);
    return;
  }

  console.log(`\nBacklog — ${backlog.length} unscheduled puzzle file(s):`);
  for (const slug of backlog) console.log(`  ${slug}.ts`);
  console.log(`\nTo schedule one, add its slug to src/schedule.ts and re-run npm run schedule:preview.\n`);
}

if (BACKLOG_ONLY) {
  console.log(`\nBacklog preview — ${backlog.length} unscheduled puzzle file(s)`);
  printBacklog();
  process.exit(0);
}

const slugWidth = Math.max(4, ...resolved.map((p) => p.slug.length));
const rel = (date: string) => (date < TODAY ? 'released' : date === TODAY ? 'TODAY' : 'future');

console.log(
  `\nSchedule preview — ${resolved.length} scheduled puzzle(s), ` +
    `${backlog.length} backlog, today ${TODAY} (UTC)\n`,
);
console.log(`  ${'day'.padStart(3)}  ${'slug'.padEnd(slugWidth)}  ${'date'.padEnd(10)}  status`);
console.log(`  ${'─'.repeat(3)}  ${'─'.repeat(slugWidth)}  ${'─'.repeat(10)}  ──────`);
for (const p of resolved) {
  const mark = p.date === TODAY ? '▶' : ' ';
  console.log(
    `${mark} ${String(p.day).padStart(3)}  ${p.slug.padEnd(slugWidth)}  ${p.date}  ${rel(p.date)}`,
  );
}

console.log(`\nBacklog: ${backlog.length} unscheduled puzzle file(s). Run npm run backlog:preview to list.`);

const warnings = previewWarnings(resolved, TODAY);
if (warnings.length === 0) {
  console.log(`\n✓ No warnings — runway healthy, no upcoming gaps.\n`);
} else {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ⚠ [${w.kind}] ${w.message}`);
  console.log('');
}
// Advisory only — preview never fails a build.
