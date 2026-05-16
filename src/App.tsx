import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { LoadedTrack, Guess } from './types';
import { puzzles, MAX_MISTAKES, isReleased, latestReleasedIndex } from './puzzles';
import { fetchPreviewUrl, sleep } from './itunes';
import { loadState, saveState, clearState, loadCurrentDay, saveCurrentDay } from './storage';
import type { PersistedGameState } from './storage';
import { useAudio } from './hooks/useAudio';
import { useKonami } from './hooks/useKonami';
import { DaySelector } from './components/DaySelector';
import { Countdown } from './components/Countdown';
import { Grid } from './components/Grid';
import { SolvedList } from './components/SolvedList';
import { MistakesDisplay } from './components/MistakesDisplay';
import { Controls } from './components/Controls';
import { EndPanel } from './components/EndPanel';
import { ResetButton } from './components/ResetButton';

const STATUS_TIMEOUT_MS = 2500;

/** Read a duration custom property from `:root` (e.g. `--exit-anim-ms`).
    Accepts CSS `ms` or `s` units; falls back to `fallbackMs` if the var
    isn't readable (SSR or stylesheet not yet attached). */
function readCssDurationMs(prop: string, fallbackMs: number): number {
  if (typeof window === 'undefined') return fallbackMs;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  if (!raw) return fallbackMs;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallbackMs;
  return raw.endsWith('ms') ? n : n * 1000;
}

const EXIT_ANIM_MS = readCssDurationMs('--exit-anim-ms', 350);
const MATCH_PULSE_MS = readCssDurationMs('--match-pulse-ms', 500);

/** Silent 1-frame WAV used as a placeholder when running with ?mock=1. */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function formatPuzzleDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function isMockMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('mock');
}

function setEqual(a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

function signature(ids: number[]): string {
  return [...ids].sort((a, b) => a - b).join(',');
}

/* ─── Per-puzzle session state ──────────────────────────────────────────────
   Everything in `SessionState` belongs to *one* puzzle and resets on day
   switch / reset. The Konami unlock, the current puzzle index, and the
   global status toast live outside the reducer because they're app-level,
   not session-level.

   Theme lifecycle: each theme is in exactly one of four states at any time:

       unsolved ──guess-correct-start──▶ matching
                                            │
                              guess-correct-pulse-end (after pulse)
                                            │
                                            ▼
                                         exiting
                                            │
                              guess-correct-exit-end (after fade)
                                            │
                                            ▼
                                          solved

   Modeling this as one state-per-theme (instead of three parallel Sets in
   the old code) means the staged animation is one state machine, not a
   relay race between three useState calls. The visual sets the Grid still
   wants (solvedThemes / exitingThemes / matchedThemes) are derived at
   render time — see the memos below. */

type ThemeState = 'unsolved' | 'matching' | 'exiting' | 'solved';

interface SessionState {
  /** Day this state belongs to. Null until the first load completes; the
   *  save effect uses this to refuse to persist outgoing state into an
   *  incoming day's slot mid-switch. */
  day: number | null;
  loadStatus: string;
  tracks: LoadedTrack[];
  /** Indexed by themeIdx; length equals puzzle.themes.length once loaded. */
  themeStates: ThemeState[];
  selected: Set<number>;
  notes: Map<number, string>;
  mistakes: number;
  guessHistory: Guess[];
  /** Sorted-comma-joined-ids of every guess made this session, used to
   *  short-circuit duplicate submissions. */
  guessSignatures: Set<string>;
  /** True on win OR loss. `mistakes < MAX_MISTAKES` distinguishes the two. */
  gameOver: boolean;
}

function initialSession(themeCount: number, loadStatus: string): SessionState {
  return {
    day: null,
    loadStatus,
    tracks: [],
    themeStates: Array<ThemeState>(themeCount).fill('unsolved'),
    selected: new Set(),
    notes: new Map(),
    mistakes: 0,
    guessHistory: [],
    guessSignatures: new Set(),
    gameOver: false,
  };
}

type Action =
  | { type: 'load-reset'; themeCount: number; loadStatus: string }
  | { type: 'load-status'; status: string }
  | { type: 'load-fresh'; day: number; themeCount: number; tracks: LoadedTrack[]; loadStatus: string }
  | { type: 'load-restore'; day: number; themeCount: number; tracks: LoadedTrack[]; persisted: PersistedGameState; loadStatus: string }
  | { type: 'toggle-select'; id: number }
  | { type: 'deselect-all' }
  | { type: 'set-note'; id: number; note: string }
  | { type: 'guess-correct-start'; themeIdx: number; themesPicked: number[]; ids: number[] }
  | { type: 'guess-correct-pulse-end'; themeIdx: number }
  | { type: 'guess-correct-exit-end'; themeIdx: number }
  | { type: 'guess-wrong'; themesPicked: number[]; ids: number[] }
  | { type: 'wrong-game-over-exit-end' }
  | { type: 'reset-puzzle'; tracks: LoadedTrack[] };

function addSig(prev: ReadonlySet<string>, ids: number[]): Set<string> {
  const next = new Set(prev);
  next.add(signature(ids));
  return next;
}

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'load-reset':
      return initialSession(action.themeCount, action.loadStatus);

    case 'load-status':
      return { ...state, loadStatus: action.status };

    case 'load-fresh':
      return {
        ...initialSession(action.themeCount, action.loadStatus),
        day: action.day,
        tracks: action.tracks,
      };

    case 'load-restore': {
      const themeStates = Array<ThemeState>(action.themeCount).fill('unsolved');
      for (const i of action.persisted.solvedThemes) {
        if (i >= 0 && i < themeStates.length) themeStates[i] = 'solved';
      }
      return {
        day: action.day,
        loadStatus: action.loadStatus,
        tracks: action.tracks,
        themeStates,
        selected: new Set(action.persisted.selected),
        notes: new Map(action.persisted.notes),
        mistakes: action.persisted.mistakes,
        guessHistory: action.persisted.guessHistory,
        guessSignatures: new Set(action.persisted.guessSignatures),
        gameOver: action.persisted.gameOver,
      };
    }

    case 'toggle-select': {
      if (state.gameOver) return state;
      const selected = new Set(state.selected);
      if (selected.has(action.id)) selected.delete(action.id);
      else if (selected.size < 4) selected.add(action.id);
      return { ...state, selected };
    }

    case 'deselect-all':
      return { ...state, selected: new Set() };

    case 'set-note': {
      const notes = new Map(state.notes);
      notes.set(action.id, action.note);
      return { ...state, notes };
    }

    case 'guess-correct-start': {
      const themeStates = state.themeStates.slice();
      themeStates[action.themeIdx] = 'matching';
      return {
        ...state,
        themeStates,
        selected: new Set(),
        guessHistory: [
          ...state.guessHistory,
          { themes: action.themesPicked, correct: true, ids: action.ids },
        ],
        guessSignatures: addSig(state.guessSignatures, action.ids),
      };
    }

    case 'guess-correct-pulse-end': {
      const themeStates = state.themeStates.slice();
      themeStates[action.themeIdx] = 'exiting';
      const allDone = themeStates.every((s) => s === 'exiting' || s === 'solved');
      return { ...state, themeStates, gameOver: state.gameOver || allDone };
    }

    case 'guess-correct-exit-end': {
      const themeStates = state.themeStates.slice();
      if (themeStates[action.themeIdx] === 'exiting') themeStates[action.themeIdx] = 'solved';
      return { ...state, themeStates };
    }

    case 'guess-wrong': {
      const mistakes = state.mistakes + 1;
      const guessHistory: Guess[] = [
        ...state.guessHistory,
        { themes: action.themesPicked, correct: false, ids: action.ids },
      ];
      const guessSignatures = addSig(state.guessSignatures, action.ids);
      if (mistakes < MAX_MISTAKES) {
        return { ...state, mistakes, guessHistory, guessSignatures };
      }
      // Out of mistakes: any theme still in flight (unsolved or mid-pulse)
      // jumps straight to exiting; the wrong-game-over-exit-end action
      // will finish them off after the fade.
      const themeStates = state.themeStates.map((s) =>
        s === 'unsolved' || s === 'matching' ? 'exiting' : s,
      ) as ThemeState[];
      return {
        ...state,
        mistakes,
        guessHistory,
        guessSignatures,
        themeStates,
        selected: new Set(),
        gameOver: true,
      };
    }

    case 'wrong-game-over-exit-end': {
      const themeStates = state.themeStates.map((s) =>
        s === 'exiting' ? 'solved' : s,
      ) as ThemeState[];
      return { ...state, themeStates };
    }

    case 'reset-puzzle':
      return {
        ...initialSession(state.themeStates.length, ''),
        day: state.day,
        tracks: action.tracks,
      };
  }
}

export function App() {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = loadCurrentDay();
    if (saved !== null) {
      const idx = puzzles.findIndex((p) => p.day === saved);
      if (idx >= 0 && isReleased(puzzles[idx]!)) return idx;
    }
    return latestReleasedIndex();
  });

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => initialSession(0, 'Loading previews from iTunes…'),
  );

  const [statusMsg, setStatusMsg] = useState('');
  /** Days unlocked at runtime — by Konami (all of them) or by the countdown
   *  ticking past a `releaseAt` (one at a time). Either case adds the day
   *  to this set; nobody reaches into module-level puzzle data anymore. */
  const [unlockedDays, setUnlockedDays] = useState<Set<number>>(() => new Set());
  // Days the player has finished (all themes solved, no mistakes left). Seeded
  // from localStorage so the green ✓ survives reloads.
  const [completedDays, setCompletedDays] = useState<Set<number>>(() => {
    const out = new Set<number>();
    for (const p of puzzles) {
      const s = loadState(p.day);
      if (s && s.gameOver && s.solvedThemes.length === p.themes.length && s.mistakes < MAX_MISTAKES) {
        out.add(p.day);
      }
    }
    return out;
  });

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadGenRef = useRef(0);

  const puzzle = puzzles[currentIndex]!;
  const themes = puzzle.themes;
  const won = state.gameOver && state.mistakes < MAX_MISTAKES;

  const { playingId, playProgress, togglePlay, stopAudio } = useAudio(state.tracks);

  /* ── Derived view-model sets (Grid/SolvedList still consume Sets) ── */
  const solvedThemes = useMemo(() => {
    const out = new Set<number>();
    state.themeStates.forEach((s, i) => {
      if (s === 'exiting' || s === 'solved') out.add(i);
    });
    return out;
  }, [state.themeStates]);
  const exitingThemes = useMemo(() => {
    const out = new Set<number>();
    state.themeStates.forEach((s, i) => {
      if (s === 'exiting') out.add(i);
    });
    return out;
  }, [state.themeStates]);
  const matchedThemes = useMemo(() => {
    const out = new Set<number>();
    state.themeStates.forEach((s, i) => {
      if (s === 'matching') out.add(i);
    });
    return out;
  }, [state.themeStates]);

  /* ── Status toast ── */
  const setStatus = useCallback((text: string) => {
    setStatusMsg(text);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setStatusMsg('');
      statusTimerRef.current = null;
    }, STATUS_TIMEOUT_MS);
  }, []);

  useEffect(() => () => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
  }, []);

  /* ── Load tracks (iTunes lookups) + restore persisted state for this day ── */
  useEffect(() => {
    const myGen = ++loadGenRef.current;
    const mock = isMockMode();
    const all = themes.flatMap((t, themeIdx) => t.tracks.map((trk) => ({ themeIdx, ...trk })));

    dispatch({
      type: 'load-reset',
      themeCount: themes.length,
      loadStatus: mock ? '' : 'Loading previews from iTunes…',
    });

    (async () => {
      const previewUrls: (string | null)[] = [];
      for (let i = 0; i < all.length; i++) {
        if (myGen !== loadGenRef.current) return;
        if (!mock) {
          dispatch({ type: 'load-status', status: `Loading previews… (${i + 1}/${all.length})` });
        }
        if (mock) {
          previewUrls.push(SILENT_WAV);
        } else {
          previewUrls.push(await fetchPreviewUrl(all[i]!.id));
          if (i < all.length - 1) await sleep(150);
        }
      }
      if (myGen !== loadGenRef.current) return;

      const loaded: LoadedTrack[] = all
        .map((x, i): LoadedTrack | null => {
          const url = previewUrls[i];
          if (!url) return null;
          const t: LoadedTrack = {
            id: i,
            themeIdx: x.themeIdx,
            previewUrl: url,
            artist: x.artist,
            title: x.title,
          };
          if (x.note !== undefined) t.note = x.note;
          return t;
        })
        .filter((t): t is LoadedTrack => t !== null);

      const loadStatus =
        loaded.length < all.length
          ? `Only got ${loaded.length}/${all.length} previews — some queries failed.`
          : '';

      const persisted = loadState(puzzle.day);
      const loadedIds = loaded.map((t) => t.id);
      if (persisted && setEqual(persisted.trackOrder, loadedIds)) {
        const byId = new Map(loaded.map((t) => [t.id, t]));
        const ordered = persisted.trackOrder
          .map((id) => byId.get(id))
          .filter((t): t is LoadedTrack => !!t);
        dispatch({
          type: 'load-restore',
          day: puzzle.day,
          themeCount: themes.length,
          tracks: ordered,
          persisted,
          loadStatus,
        });
      } else {
        dispatch({
          type: 'load-fresh',
          day: puzzle.day,
          themeCount: themes.length,
          tracks: shuffle(loaded),
          loadStatus,
        });
      }
    })();

    return () => {
      loadGenRef.current++;
    };
  }, [themes, puzzle.day]);

  /* ── Persist game state on every change (after tracks have loaded) ── */
  useEffect(() => {
    if (state.tracks.length === 0) return;
    // Skip while a day switch is in flight: state.day marks the day this
    // session belongs to. Without this guard the outgoing day's state
    // would briefly satisfy this effect under the incoming day's key.
    if (state.day !== puzzle.day) return;
    saveState(puzzle.day, {
      selected: [...state.selected],
      solvedThemes: [...solvedThemes],
      notes: [...state.notes],
      mistakes: state.mistakes,
      guessHistory: state.guessHistory,
      gameOver: state.gameOver,
      trackOrder: state.tracks.map((t) => t.id),
      guessSignatures: [...state.guessSignatures],
    });
  }, [puzzle.day, state, solvedThemes]);

  /* ── Selection ── */
  const toggleSelect = useCallback((id: number) => {
    dispatch({ type: 'toggle-select', id });
  }, []);

  const deselectAll = useCallback(() => {
    dispatch({ type: 'deselect-all' });
  }, []);

  const setNote = useCallback((id: number, val: string) => {
    dispatch({ type: 'set-note', id, note: val });
  }, []);

  /* ── Submit ── */
  const submit = useCallback(() => {
    if (state.gameOver) return;
    if (state.selected.size !== 4) return;
    const ids = [...state.selected];
    const sig = signature(ids);
    if (state.guessSignatures.has(sig)) {
      setStatus('Already guessed!');
      return;
    }

    const themesPicked = ids.map((id) => {
      const trk = state.tracks.find((t) => t.id === id);
      return trk?.themeIdx ?? -1;
    });
    const counts = new Map<number, number>();
    for (const t of themesPicked) counts.set(t, (counts.get(t) ?? 0) + 1);
    const maxCount = Math.max(...counts.values());
    const correct = maxCount === 4;

    if (correct) {
      const themeIdx = themesPicked[0]!;
      const remainingUnsolved = state.themeStates.filter((s) => s !== 'exiting' && s !== 'solved').length;
      const willWin = remainingUnsolved === 1;
      // Pause any currently-playing preview so the match feedback isn't
      // talked over and we don't keep a tile playing once it's removed.
      stopAudio();
      dispatch({ type: 'guess-correct-start', themeIdx, themesPicked, ids });
      setStatus(willWin ? 'All four solved.' : `Solved: ${themes[themeIdx]!.theme}`);
      // Stage 2: end pulse, slide in the banner, start tile fade-out.
      setTimeout(() => {
        dispatch({ type: 'guess-correct-pulse-end', themeIdx });
        // Stage 3: fade complete, remove tiles from grid.
        setTimeout(() => dispatch({ type: 'guess-correct-exit-end', themeIdx }), EXIT_ANIM_MS);
      }, MATCH_PULSE_MS);
    } else {
      const nextMistakes = state.mistakes + 1;
      dispatch({ type: 'guess-wrong', themesPicked, ids });
      if (nextMistakes >= MAX_MISTAKES) {
        setStatus('Out of mistakes.');
        setTimeout(() => dispatch({ type: 'wrong-game-over-exit-end' }), EXIT_ANIM_MS);
      } else if (maxCount === 3) {
        setStatus('One away…');
      } else {
        setStatus('Not a group. Try again.');
      }
    }
  }, [state, themes, setStatus, stopAudio]);

  /* ── Switch day ── (load effect resets in-memory state when puzzle.day changes) */
  const switchDay = useCallback(
    (idx: number) => {
      if (idx === currentIndex) return;
      const p = puzzles[idx];
      if (!p || !isReleased(p, { unlocked: unlockedDays })) return;
      stopAudio();
      setCurrentIndex(idx);
    },
    [currentIndex, stopAudio, unlockedDays],
  );

  /* ── Reset current puzzle (clears persisted state + reshuffles) ── */
  const resetPuzzle = useCallback(() => {
    clearState(puzzle.day);
    stopAudio();
    dispatch({ type: 'reset-puzzle', tracks: shuffle(state.tracks) });
    setStatus('Puzzle reset.');
  }, [puzzle.day, state.tracks, stopAudio, setStatus]);

  /* ── Konami code (↑↑↓↓←→←→BA) unlocks every puzzle ── */
  const onKonamiUnlock = useCallback(() => {
    setUnlockedDays(new Set(puzzles.map((p) => p.day)));
    setStatus('🎮 Konami! All puzzles unlocked.');
  }, [setStatus]);
  useKonami(onKonamiUnlock);

  /* ── Countdown announces a day became available naturally ── */
  const onNaturalUnlock = useCallback((day: number) => {
    setUnlockedDays((prev) => {
      if (prev.has(day)) return prev;
      const next = new Set(prev);
      next.add(day);
      return next;
    });
  }, []);

  /* ── Persist current day when puzzle changes ── */
  useEffect(() => {
    saveCurrentDay(puzzle.day);
  }, [puzzle.day]);

  /* ── Recompute completedDays from authoritative state on every change.
        For the current day, the live in-memory state is authoritative; for
        other days, localStorage is. This way a stale in-memory set can never
        drift from the persisted truth, and a Reset on one day correctly drops
        its check without us having to remember to setCompletedDays in
        resetPuzzle. */
  useEffect(() => {
    if (state.day !== puzzle.day) return;
    const next = new Set<number>();
    for (const p of puzzles) {
      let isDone: boolean;
      if (p.day === puzzle.day) {
        isDone = state.gameOver && won;
      } else {
        const s = loadState(p.day);
        isDone = !!(
          s && s.gameOver && s.solvedThemes.length === p.themes.length && s.mistakes < MAX_MISTAKES
        );
      }
      if (isDone) next.add(p.day);
    }
    setCompletedDays((prev) => {
      if (prev.size === next.size && [...prev].every((d) => next.has(d))) return prev;
      return next;
    });
  }, [state.day, puzzle.day, state.gameOver, won]);

  const heading = `Audio Connections ${puzzle.day}`;
  const dateText = useMemo(() => formatPuzzleDate(puzzle.date), [puzzle.date]);
  const selectedCount = state.selected.size;
  const isLoading = state.tracks.length === 0;
  const tilesDisabled = state.gameOver || isLoading || matchedThemes.size > 0;

  return (
    <div className="app-container">
      <h1 data-testid="puzzle-heading">{heading}</h1>
      <div className="byline">
        by <span data-testid="puzzle-author">{puzzle.author}</span> · <span data-testid="puzzle-date">{dateText}</span>
      </div>
      <DaySelector
        puzzles={puzzles}
        currentIndex={currentIndex}
        completedDays={completedDays}
        unlockedDays={unlockedDays}
        onSwitch={switchDay}
      />
      <Countdown puzzles={puzzles} unlockedDays={unlockedDays} onUnlock={onNaturalUnlock} />
      <div className="subtitle">Find four groups of four. Tap to play, "Select" to group.</div>
      <SolvedList themes={themes} solvedThemes={solvedThemes} tracks={state.tracks} />
      {state.gameOver && (
        <EndPanel won={won} day={puzzle.day} guessHistory={state.guessHistory} />
      )}
      <Grid
        tracks={state.tracks}
        selected={state.selected}
        solvedThemes={solvedThemes}
        exitingThemes={exitingThemes}
        matchedThemes={matchedThemes}
        playingId={playingId}
        playProgress={playProgress}
        notes={state.notes}
        disabled={tilesDisabled}
        onPlay={togglePlay}
        onSelect={toggleSelect}
        onNoteChange={setNote}
      />
      <div className="status" data-testid="status">{statusMsg || state.loadStatus}</div>
      <MistakesDisplay mistakes={state.mistakes} max={MAX_MISTAKES} />
      <Controls
        selectedCount={selectedCount}
        gameOver={state.gameOver}
        won={won}
        onDeselect={deselectAll}
        onSubmit={submit}
      />
      <ResetButton onReset={resetPuzzle} />
    </div>
  );
}
