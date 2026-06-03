import { describe, expect, it } from 'vitest';
import {
  changedFilesForITunesCheck,
  puzzleSlugFromPath,
  puzzleSlugsFromPaths,
  resolveITunesCheckScope,
} from './itunesValidationScope';

describe('iTunes validation scope', () => {
  it('maps puzzle paths to slugs and ignores the template', () => {
    expect(puzzleSlugFromPath('src/puzzles/farana-3.ts')).toBe('farana-3');
    expect(puzzleSlugFromPath('./src/puzzles/day-12.ts')).toBe('day-12');
    expect(puzzleSlugFromPath('src/puzzles/template.ts')).toBeNull();
    expect(puzzleSlugFromPath('src/puzzles/nested/nope.ts')).toBeNull();
  });

  it('deduplicates changed puzzle slugs while ignoring non-puzzle files', () => {
    expect(
      puzzleSlugsFromPaths([
        'src/puzzles/day-1.ts',
        'src/App.tsx',
        'src/puzzles/day-1.ts',
        'src/puzzles/rob-tetrel-2.ts',
      ]),
    ).toEqual(['day-1', 'rob-tetrel-2']);
  });

  it('uses explicit changed files when provided', () => {
    const execCalls: string[][] = [];
    const execFile = (_file: string, args: string[]) => {
      execCalls.push(args);
      return '';
    };

    expect(
      changedFilesForITunesCheck(
        '/repo',
        { ITUNES_CHANGED_FILES: 'src/puzzles/day-2.ts, src/App.tsx\nsrc/puzzles/day-3.ts' },
        execFile,
      ),
    ).toEqual(['src/puzzles/day-2.ts', 'src/App.tsx', 'src/puzzles/day-3.ts']);
    expect(execCalls).toEqual([]);
  });

  it('honors an explicit empty changed-file list', () => {
    const execCalls: string[][] = [];
    const execFile = (_file: string, args: string[]) => {
      execCalls.push(args);
      return 'src/puzzles/day-4.ts\n';
    };

    expect(changedFilesForITunesCheck('/repo', { ITUNES_CHANGED_FILES: '' }, execFile)).toEqual([]);
    expect(execCalls).toEqual([]);
  });

  it('checks the base ref plus local staged, unstaged, committed, and untracked changes', () => {
    const calls: string[][] = [];
    const outputs = new Map<string, string>([
      ['diff --name-only --diff-filter=ACMR origin/main...HEAD', 'src/puzzles/day-4.ts\n'],
      ['diff --name-only --diff-filter=ACMR', 'src/puzzles/day-5.ts\n'],
      ['diff --name-only --cached --diff-filter=ACMR', 'src/puzzles/day-6.ts\n'],
      ['diff-tree --no-commit-id --name-only -r HEAD', 'src/puzzles/day-7.ts\n'],
      ['ls-files --others --exclude-standard src/puzzles', 'src/puzzles/day-8.ts\n'],
    ]);
    const execFile = (_file: string, args: string[]) => {
      calls.push(args);
      const output = outputs.get(args.join(' '));
      if (output === undefined && args[0] === 'rev-parse') throw new Error('missing ref');
      return output ?? '';
    };

    expect(changedFilesForITunesCheck('/repo', {}, execFile)).toEqual([
      'src/puzzles/day-4.ts',
      'src/puzzles/day-5.ts',
      'src/puzzles/day-6.ts',
      'src/puzzles/day-7.ts',
      'src/puzzles/day-8.ts',
    ]);
    expect(calls).toHaveLength(6);
  });

  it('prefers upstream/main over origin/main when both are available locally', () => {
    const calls: string[][] = [];
    const outputs = new Map<string, string>([
      ['rev-parse --verify upstream/main', 'abc123\n'],
      ['diff --name-only --diff-filter=ACMR upstream/main...HEAD', 'src/puzzles/day-9.ts\n'],
    ]);
    const execFile = (_file: string, args: string[]) => {
      calls.push(args);
      return outputs.get(args.join(' ')) ?? '';
    };

    expect(changedFilesForITunesCheck('/repo', {}, execFile)).toContain('src/puzzles/day-9.ts');
    expect(calls.map((args) => args.join(' '))).toContain(
      'diff --name-only --diff-filter=ACMR upstream/main...HEAD',
    );
  });

  it('can be forced to full-fleet mode', () => {
    expect(resolveITunesCheckScope('/repo', { ITUNES_CHECK_SCOPE: 'all' })).toEqual({
      kind: 'all',
      reason: 'ITUNES_CHECK_SCOPE=all',
    });
  });
});
