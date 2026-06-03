import { execFileSync } from 'node:child_process';

export type ITunesCheckScope =
  | { kind: 'all'; reason: string }
  | { kind: 'changed'; changedFiles: string[]; slugs: string[]; reason: string };

type Env = Record<string, string | undefined>;
type ExecFile = (
  file: string,
  args: string[],
  options: { cwd: string; encoding: 'utf8'; stdio: ['ignore', 'pipe', 'ignore'] },
) => string;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export function puzzleSlugFromPath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '');
  const match = /^src\/puzzles\/([^/]+)\.ts$/.exec(normalized);
  if (!match || match[1] === 'template') return null;
  return match[1]!;
}

export function puzzleSlugsFromPaths(paths: string[]): string[] {
  return unique(paths.map(puzzleSlugFromPath).filter((slug): slug is string => slug !== null));
}

function runGit(cwd: string, args: string[], execFile: ExecFile): string[] {
  try {
    return splitList(execFile('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return [];
  }
}

function refExists(cwd: string, ref: string, execFile: ExecFile): boolean {
  try {
    execFile('git', ['rev-parse', '--verify', ref], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function baseRefForGit(cwd: string, env: Env, execFile: ExecFile): string {
  if (env.ITUNES_BASE_REF) return env.ITUNES_BASE_REF;
  if (env.GITHUB_BASE_REF) return `origin/${env.GITHUB_BASE_REF}`;
  if (refExists(cwd, 'upstream/main', execFile)) return 'upstream/main';
  return 'origin/main';
}

export function changedFilesForITunesCheck(
  cwd: string,
  env: Env = process.env,
  execFile: ExecFile = execFileSync,
): string[] {
  if (env.ITUNES_CHANGED_FILES !== undefined) return unique(splitList(env.ITUNES_CHANGED_FILES));

  const baseRef = baseRefForGit(cwd, env, execFile);
  return unique([
    ...runGit(cwd, ['diff', '--name-only', '--diff-filter=ACMR', `${baseRef}...HEAD`], execFile),
    ...runGit(cwd, ['diff', '--name-only', '--diff-filter=ACMR'], execFile),
    ...runGit(cwd, ['diff', '--name-only', '--cached', '--diff-filter=ACMR'], execFile),
    ...runGit(cwd, ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], execFile),
    ...runGit(cwd, ['ls-files', '--others', '--exclude-standard', 'src/puzzles'], execFile),
  ]);
}

export function resolveITunesCheckScope(
  cwd: string,
  env: Env = process.env,
  execFile: ExecFile = execFileSync,
): ITunesCheckScope {
  if (env.ITUNES_CHECK_SCOPE === 'all') {
    return { kind: 'all', reason: 'ITUNES_CHECK_SCOPE=all' };
  }

  const changedFiles = changedFilesForITunesCheck(cwd, env, execFile);
  const slugs = puzzleSlugsFromPaths(changedFiles);
  return {
    kind: 'changed',
    changedFiles,
    slugs,
    reason: env.ITUNES_CHANGED_FILES
      ? 'ITUNES_CHANGED_FILES'
      : `git changes against ${baseRefForGit(cwd, env, execFile)}, working tree, index, and untracked puzzle files`,
  };
}
