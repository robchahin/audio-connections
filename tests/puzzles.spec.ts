import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { puzzles } from './helpers/puzzles';

const here = dirname(fileURLToPath(import.meta.url));
const puzzleDir = join(here, '..', 'src', 'puzzles');

// Extracts iTunes IDs (the `id: 1234567890` field on each track) from raw
// puzzle-file source text. Used to compare the ID set on this branch against
// the set on main, so a schema-only change doesn't trigger any API calls.
function extractIds(source: string): Set<number> {
  const ids = new Set<number>();
  for (const m of source.matchAll(/\bid:\s*(\d+)/g)) {
    ids.add(parseInt(m[1]!, 10));
  }
  return ids;
}

// Returns the iTunes IDs that are new on this branch — i.e. present in a
// changed puzzle file's current source but not in the same file's `main`
// version. A pure schema migration that touches every day file but changes no
// IDs returns []. A brand-new puzzle file returns all 16 of its IDs. We diff
// against `main...HEAD` (merge-base) so a stale local main only ever
// over-includes; it never silently drops IDs the PR actually changed.
function newIdsOnBranch(): number[] {
  let changedFiles: string[] = [];
  try {
    const out = execSync(
      "git diff --name-only main...HEAD -- 'src/puzzles/day-*.ts'",
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    changedFiles = out.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch {
    return [];
  }

  const repoRoot = join(here, '..');
  const newIds = new Set<number>();
  for (const relPath of changedFiles) {
    let mainSource = '';
    try {
      mainSource = execSync(`git show main:${relPath}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      // File didn't exist on main — every ID in the current version is new.
    }

    let headSource: string;
    try {
      headSource = readFileSync(join(repoRoot, relPath), 'utf8');
    } catch {
      continue; // file deleted on this branch — nothing to verify
    }

    const mainIds = extractIds(mainSource);
    for (const id of extractIds(headSource)) {
      if (!mainIds.has(id)) newIds.add(id);
    }
  }
  return [...newIds].sort((a, b) => a - b);
}

interface ITunesResult {
  wrapperType?: string;
  collectionType?: string;
  kind?: string;
  trackId?: number;
  collectionId?: number;
  artistId?: number;
  previewUrl?: string;
}

test.describe('puzzle calendar', () => {
  test('every file in src/puzzles/ matches the day-N.ts naming convention', () => {
    const files = readdirSync(puzzleDir).filter((f) => f !== 'template.ts');
    for (const f of files) {
      expect(f, `unexpected file in src/puzzles/: ${f}`).toMatch(/^day-\d+\.ts$/);
    }
  });

  test('every day-N.ts file is loaded into the puzzles array', () => {
    const files = readdirSync(puzzleDir).filter((f) => /^day-\d+\.ts$/.test(f));
    expect(puzzles.length).toBe(files.length);
  });

  test('each puzzle has a unique day number', () => {
    const days = puzzles.map((p) => p.day);
    expect(new Set(days).size).toBe(days.length);
  });

  test('filename day number matches exported day number', () => {
    const files = readdirSync(puzzleDir).filter((f) => /^day-\d+\.ts$/.test(f));
    for (const f of files) {
      const expected = parseInt(/^day-(\d+)\.ts$/.exec(f)![1]!, 10);
      const found = puzzles.find((p) => p.day === expected);
      expect(found, `${f}: no puzzle with day=${expected} was loaded`).toBeDefined();
    }
  });

  // releaseAt is optional in the type, but every shipped puzzle must carry one:
  // isReleased() now hides any puzzle missing it, so a forgotten releaseAt
  // would silently make a day unreachable. This test catches that at CI time.
  test('every puzzle has a valid releaseAt timestamp', () => {
    for (const p of puzzles) {
      expect(typeof p.releaseAt, `day ${p.day}: releaseAt is missing`).toBe('string');
      const ms = new Date(p.releaseAt!).getTime();
      expect(
        Number.isNaN(ms),
        `day ${p.day}: releaseAt "${p.releaseAt}" is not a parseable date`,
      ).toBe(false);
      expect(
        p.releaseAt!.startsWith(p.date),
        `day ${p.day}: releaseAt "${p.releaseAt}" does not match date "${p.date}"`,
      ).toBe(true);
    }
  });

  // Catches the case where an iTunes collectionId is pasted in place of a
  // trackId — the preview wouldn't load in-app, but the data otherwise looks
  // valid and the build doesn't flag it. Scope is the *IDs* that are new on
  // this branch, not the files that changed: a schema migration touching
  // every day file but changing no IDs makes zero API calls. A brand-new
  // puzzle adds 16 IDs; a track swap adds one. Everything new gets batched
  // into a single iTunes lookup request.
  test('new iTunes IDs on this branch resolve to playable tracks', async () => {
    const ids = newIdsOnBranch();
    test.skip(ids.length === 0, 'no new iTunes IDs vs main');

    const res = await fetch(`https://itunes.apple.com/lookup?id=${ids.join(',')}`, {
      signal: AbortSignal.timeout(10000),
    });
    expect(res.ok, `iTunes lookup HTTP ${res.status}`).toBe(true);

    const { results } = (await res.json()) as { results: ITunesResult[] };

    // For diagnostics, map every ID back to the track entry that introduced
    // it so failures name the artist/title/day, not just an opaque ID.
    const trackByNewId = new Map<number, { day: number; artist: string; title: string }>();
    for (const p of puzzles) {
      for (const theme of p.themes) {
        for (const t of theme.tracks) {
          if (!trackByNewId.has(t.id)) {
            trackByNewId.set(t.id, { day: p.day, artist: t.artist, title: t.title });
          }
        }
      }
    }

    for (const id of ids) {
      const ctx = trackByNewId.get(id);
      const label = ctx
        ? `day ${ctx.day} id ${id} (${ctx.artist} — ${ctx.title})`
        : `id ${id}`;

      const asTrack = results.find((r) => r.wrapperType === 'track' && r.trackId === id);

      if (!asTrack) {
        const other = results.find(
          (r) => r.trackId === id || r.collectionId === id || r.artistId === id,
        );
        const diag = other
          ? `${label} resolved to ${other.wrapperType}/${other.collectionType ?? other.kind ?? '?'}, expected a song track`
          : `${label} returned no result from iTunes`;
        expect(asTrack, diag).toBeDefined();
        continue;
      }

      expect(
        asTrack.kind,
        `${label} kind is "${asTrack.kind}", expected "song"`,
      ).toBe('song');
      expect(
        typeof asTrack.previewUrl === 'string' && asTrack.previewUrl.length > 0,
        `${label} has no previewUrl`,
      ).toBe(true);
    }
  });
});
