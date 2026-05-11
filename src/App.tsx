import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LoadedTrack, Guess } from './types';
import { puzzles, MAX_MISTAKES, isReleased, latestReleasedIndex } from './puzzles';
import { fetchPreviewUrl, sleep } from './itunes';
import { DaySelector } from './components/DaySelector';
import { Countdown } from './components/Countdown';
import { Grid } from './components/Grid';
import { SolvedList } from './components/SolvedList';
import { MistakesDisplay } from './components/MistakesDisplay';
import { Controls } from './components/Controls';
import { EndPanel } from './components/EndPanel';

const STATUS_TIMEOUT_MS = 2500;
const EXIT_ANIM_MS = 400;

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

export function App() {
  const [currentIndex, setCurrentIndex] = useState(() => latestReleasedIndex());
  const [tracks, setTracks] = useState<LoadedTrack[]>([]);
  const [loadStatus, setLoadStatus] = useState('Loading previews from iTunes…');
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [solvedThemes, setSolvedThemes] = useState<Set<number>>(() => new Set());
  const [exitingThemes, setExitingThemes] = useState<Set<number>>(() => new Set());
  const [notes, setNotes] = useState<Map<number, string>>(() => new Map());
  const [mistakes, setMistakes] = useState(0);
  const [guessHistory, setGuessHistory] = useState<Guess[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guessSigRef = useRef<Set<string>>(new Set());
  const loadGenRef = useRef(0);

  const puzzle = puzzles[currentIndex]!;
  const themes = puzzle.themes;
  const won = solvedThemes.size === themes.length && mistakes < MAX_MISTAKES;

  /* ── Status toast ── */
  const setStatus = useCallback((text: string) => {
    setStatusMsg(text);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setStatusMsg('');
      statusTimerRef.current = null;
    }, STATUS_TIMEOUT_MS);
  }, []);

  /* ── Load tracks (iTunes lookups) ── */
  useEffect(() => {
    const myGen = ++loadGenRef.current;
    const mock = isMockMode();
    const all = themes.flatMap((t, themeIdx) => t.tracks.map((trk) => ({ themeIdx, ...trk })));
    setLoadStatus(mock ? '' : 'Loading previews from iTunes…');
    setTracks([]);

    (async () => {
      const previewUrls: (string | null)[] = [];
      for (let i = 0; i < all.length; i++) {
        if (myGen !== loadGenRef.current) return;
        if (!mock) setLoadStatus(`Loading previews… (${i + 1}/${all.length})`);
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

      setLoadStatus(
        loaded.length < all.length
          ? `Only got ${loaded.length}/${all.length} previews — some queries failed.`
          : '',
      );
      setTracks(shuffle(loaded));
    })();

    return () => {
      // bump gen so async ops bail
      loadGenRef.current++;
    };
  }, [themes]);

  /* ── Audio playback ── */
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
    setPlayProgress(0);
  }, []);

  const togglePlay = useCallback(
    (id: number) => {
      const track = tracks.find((t) => t.id === id);
      if (!track) return;

      const audio = audioRef.current;
      const isThisPlaying =
        audio !== null && playingId === id && !audio.paused && !audio.ended;

      stopAudio();
      if (isThisPlaying) return;

      const next = new Audio(track.previewUrl);
      audioRef.current = next;
      setPlayingId(id);
      setPlayProgress(0);

      next.addEventListener('ended', () => {
        if (audioRef.current === next) {
          stopAudio();
        }
      });
      next.addEventListener('timeupdate', () => {
        if (audioRef.current !== next) return;
        const dur = next.duration || 30;
        setPlayProgress(next.currentTime / dur);
      });
      next.play().catch((err) => {
        console.warn('Audio play failed:', err);
        if (audioRef.current === next) {
          stopAudio();
        }
      });
    },
    [tracks, playingId, stopAudio],
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = null;
    };
  }, []);

  /* ── Selection ── */
  const toggleSelect = useCallback(
    (id: number) => {
      if (gameOver) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else if (next.size < 4) {
          next.add(id);
        }
        return next;
      });
    },
    [gameOver],
  );

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const setNote = useCallback((id: number, val: string) => {
    setNotes((prev) => {
      const next = new Map(prev);
      next.set(id, val);
      return next;
    });
  }, []);

  /* ── Submit ── */
  const submit = useCallback(() => {
    if (gameOver) return;
    if (selected.size !== 4) return;
    const ids = [...selected];
    const sig = [...ids].sort((a, b) => a - b).join(',');
    if (guessSigRef.current.has(sig)) {
      setStatus('Already guessed!');
      return;
    }
    guessSigRef.current.add(sig);

    const themesPicked = ids.map((id) => {
      const trk = tracks.find((t) => t.id === id);
      return trk?.themeIdx ?? -1;
    });
    const counts = new Map<number, number>();
    for (const t of themesPicked) counts.set(t, (counts.get(t) ?? 0) + 1);
    const maxCount = Math.max(...counts.values());
    const correct = maxCount === 4;
    setGuessHistory((prev) => [...prev, { themes: themesPicked, correct }]);

    if (correct) {
      const themeIdx = themesPicked[0]!;
      setExitingThemes(new Set([themeIdx]));
      setSelected(new Set());
      const newSolved = new Set(solvedThemes);
      newSolved.add(themeIdx);
      setSolvedThemes(newSolved);
      if (newSolved.size === themes.length) {
        setGameOver(true);
        setStatus('All four solved.');
      } else {
        setStatus(`Solved: ${themes[themeIdx]!.theme}`);
      }
      setTimeout(() => setExitingThemes(new Set()), EXIT_ANIM_MS);
    } else {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (nextMistakes >= MAX_MISTAKES) {
        setGameOver(true);
        const exiting = new Set<number>();
        const newSolved = new Set(solvedThemes);
        for (let i = 0; i < themes.length; i++) {
          if (!newSolved.has(i)) exiting.add(i);
          newSolved.add(i);
        }
        setExitingThemes(exiting);
        setSolvedThemes(newSolved);
        setSelected(new Set());
        setStatus('Out of mistakes.');
        setTimeout(() => setExitingThemes(new Set()), EXIT_ANIM_MS);
      } else if (maxCount === 3) {
        setStatus('One away…');
      } else {
        setStatus('Not a group. Try again.');
      }
    }
  }, [gameOver, selected, tracks, themes, solvedThemes, mistakes, setStatus]);

  /* ── Switch day ── */
  const switchDay = useCallback(
    (idx: number) => {
      if (idx === currentIndex) return;
      const p = puzzles[idx];
      if (!p || !isReleased(p)) return;
      stopAudio();
      setSelected(new Set());
      setSolvedThemes(new Set());
      setExitingThemes(new Set());
      setNotes(new Map());
      setMistakes(0);
      setGuessHistory([]);
      setGameOver(false);
      guessSigRef.current = new Set();
      setCurrentIndex(idx);
    },
    [currentIndex, stopAudio],
  );

  /* ── Force re-render (for unlockAll + countdown-driven unlocks) ── */
  const [, forceRender] = useState(0);
  const bump = useCallback(() => forceRender((n) => n + 1), []);

  /* ── Expose window.unlockAll for manually unlocking all puzzles ── */
  useEffect(() => {
    const w = window as unknown as { unlockAll?: () => void };
    w.unlockAll = () => {
      for (const p of puzzles) delete p.releaseAt;
      bump();
      console.log('All puzzles unlocked. Reload the page to revert.');
    };
    return () => {
      delete w.unlockAll;
    };
  }, [bump]);

  /* ── Update document title when puzzle changes ── */
  useEffect(() => {
    document.title = `Audio Connections ${puzzle.day} — by Corey Farwell`;
  }, [puzzle.day]);

  const heading = `Audio Connections ${puzzle.day}`;
  const dateText = useMemo(() => formatPuzzleDate(puzzle.date), [puzzle.date]);
  const selectedCount = selected.size;
  const isLoading = tracks.length === 0;
  const tilesDisabled = gameOver || isLoading;

  return (
    <div className="app-container">
      <h1 data-testid="puzzle-heading">{heading}</h1>
      <div className="byline">
        by Corey Farwell · <span data-testid="puzzle-date">{dateText}</span>
      </div>
      <DaySelector puzzles={puzzles} currentIndex={currentIndex} onSwitch={switchDay} />
      <Countdown puzzles={puzzles} onUnlock={bump} />
      <div className="subtitle">Find four groups of four. Tap to play, "Select" to group.</div>
      <SolvedList themes={themes} solvedThemes={solvedThemes} tracks={tracks} />
      {gameOver && (
        <EndPanel won={won} day={puzzle.day} guessHistory={guessHistory} />
      )}
      <Grid
        tracks={tracks}
        selected={selected}
        solvedThemes={solvedThemes}
        exitingThemes={exitingThemes}
        playingId={playingId}
        playProgress={playProgress}
        notes={notes}
        disabled={tilesDisabled}
        onPlay={togglePlay}
        onSelect={toggleSelect}
        onNoteChange={setNote}
      />
      <div className="status" data-testid="status">{statusMsg || loadStatus}</div>
      <MistakesDisplay mistakes={mistakes} max={MAX_MISTAKES} />
      <Controls
        selectedCount={selectedCount}
        gameOver={gameOver}
        won={won}
        onDeselect={deselectAll}
        onSubmit={submit}
      />
    </div>
  );
}
