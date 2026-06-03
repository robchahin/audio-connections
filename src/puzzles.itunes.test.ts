import { describe, expect, it } from 'vitest';
import { findBacklogSlugs, LAUNCH_EPOCH, resolve, schedule } from './schedule';
import type { PuzzleContent } from './types';
import { validatePuzzleContent } from './puzzles';
import { resolveITunesCheckScope } from './itunesValidationScope';

// Network-dependent: confirms changed puzzle files' iTunes IDs resolve to
// playable song tracks, catching a collectionId pasted in place of a trackId
// without re-querying the whole archive on every puzzle PR. Use
// `npm run test:itunes:all` for the explicit full-fleet catalog sweep. This
// lives in its own file so the default `npm run test:unit` remains offline.

interface ITunesResult {
  wrapperType?: string;
  collectionType?: string;
  kind?: string;
  trackId?: number;
  collectionId?: number;
  artistId?: number;
  previewUrl?: string;
}

interface PuzzleFile {
  slug: string;
  label: string;
  themes: PuzzleContent['themes'];
}

function slugFromPath(path: string): string {
  const match = /\/([^/]+)\.ts$/.exec(path);
  if (!match) throw new Error(`Unexpected puzzle path: ${path}`);
  return match[1]!;
}

const modules = import.meta.glob<{ default: unknown }>(
  ['./puzzles/*.ts', '!./puzzles/template.ts'],
  { eager: true },
);

const contentBySlug = new Map<string, PuzzleContent>();
for (const [path, mod] of Object.entries(modules)) {
  validatePuzzleContent(mod.default, path);
  contentBySlug.set(slugFromPath(path), mod.default);
}

const scheduled = resolve(schedule, contentBySlug, LAUNCH_EPOCH);
const scheduledFiles: PuzzleFile[] = scheduled.map((p) => ({
  slug: p.slug,
  label: `day ${p.day}`,
  themes: p.content.themes,
}));
const backlogFiles: PuzzleFile[] = findBacklogSlugs(contentBySlug.keys(), schedule).map((slug) => {
  const content = contentBySlug.get(slug)!;
  return { slug, label: `backlog ${slug}`, themes: content.themes };
});
const puzzleFiles = [...scheduledFiles, ...backlogFiles];

const scope = resolveITunesCheckScope(process.cwd());
const selectedPuzzleFiles =
  scope.kind === 'all'
    ? puzzleFiles
    : puzzleFiles.filter((p) => scope.slugs.includes(p.slug));

const allIds = [...new Set(selectedPuzzleFiles.flatMap((p) => p.themes.flatMap((t) => t.tracks.map((tr) => tr.id))))];

function scopeLabel(): string {
  if (scope.kind === 'all') return `full fleet (${selectedPuzzleFiles.length} puzzle files)`;
  if (selectedPuzzleFiles.length === 0) return 'no changed puzzle files';
  return `${selectedPuzzleFiles.length} changed puzzle file(s): ${selectedPuzzleFiles.map((p) => p.slug).join(', ')}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function lookupBatch(batch: number[]): Promise<ITunesResult[]> {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${batch.join(',')}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = (await res.json()) as { results: ITunesResult[] };
      return data.results;
    }
    if (attempt === MAX_ATTEMPTS) throw new Error(`iTunes lookup HTTP ${res.status}`);
    await sleep(500 * attempt);
  }
  throw new Error('unreachable iTunes lookup retry state');
}

describe('iTunes IDs resolve to playable song tracks', () => {
  if (selectedPuzzleFiles.length === 0) {
    it(`skips network lookup: ${scopeLabel()}`, () => {
      expect(scope.kind).toBe('changed');
      expect(allIds).toHaveLength(0);
    });
    return;
  }

  it(
    `resolves ${allIds.length} ID(s) to song tracks with previews (${scopeLabel()})`,
    async () => {
      // Keep batches small so the validation path resembles loading one
      // puzzle instead of relying on Apple's large-bulk lookup behavior.
      const BATCH_SIZE = 25;
      const results: ITunesResult[] = [];
      for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
        const batch = allIds.slice(i, i + BATCH_SIZE);
        results.push(...(await lookupBatch(batch)));
      }

      // Map every ID back to the track that uses it so failures name the
      // artist/title/day, not just an opaque ID.
      const trackById = new Map<number, { label: string; artist: string; title: string }>();
      for (const p of selectedPuzzleFiles) {
        for (const theme of p.themes) {
          for (const t of theme.tracks) {
            if (!trackById.has(t.id)) {
              trackById.set(t.id, { label: p.label, artist: t.artist, title: t.title });
            }
          }
        }
      }

      // Collect all bad IDs and assert at the end so one pass reports every
      // failure — useful when iTunes drops several catalog entries at once.
      const failures: string[] = [];
      for (const id of allIds) {
        const ctx = trackById.get(id);
        const label = ctx
          ? `${ctx.label} id ${id} (${ctx.artist} — ${ctx.title})`
          : `id ${id}`;

        const asTrack = results.find((r) => r.wrapperType === 'track' && r.trackId === id);
        if (!asTrack) {
          const other = results.find(
            (r) => r.trackId === id || r.collectionId === id || r.artistId === id,
          );
          failures.push(
            other
              ? `${label} resolved to ${other.wrapperType}/${other.collectionType ?? other.kind ?? '?'}, expected a song track`
              : `${label} returned no result from iTunes`,
          );
          continue;
        }
        if (asTrack.kind !== 'song') {
          failures.push(`${label} kind is "${asTrack.kind}", expected "song"`);
        }
        if (!(typeof asTrack.previewUrl === 'string' && asTrack.previewUrl.length > 0)) {
          failures.push(`${label} has no previewUrl`);
        }
      }

      expect(failures, `${failures.length} iTunes ID(s) failed:\n  ${failures.join('\n  ')}`).toEqual([]);
    },
    60_000,
  );
});
