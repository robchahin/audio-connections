import { useEffect, useRef, useState } from 'react';
import type { Guess, LoadedTrack, Theme } from '../types';

/** Layout axis for mobile chrome components — independent of viewport
 *  orientation so each chrome region can pick its preferred axis. */
export type ChromeOrientation = 'horizontal' | 'vertical';

interface SolvedBarProps {
  themes: Theme[];
  solvedThemes: Set<number>;
  tracks: LoadedTrack[];
  guessHistory: Guess[];
  orientation: ChromeOrientation;
  playingId: number | null;
  onPlay: (id: number) => void;
}

const SIDES = ['A', 'B', 'C', 'D'];

/** Mobile chrome: row (portrait) or column (landscape) of squircles, one
 *  per solved theme. Tapping a squircle opens a popover with the theme's
 *  tracks. Popover opens downward in portrait and rightward in landscape. */
export function SolvedBar({
  themes,
  solvedThemes,
  tracks,
  guessHistory,
  orientation,
  playingId,
  onPlay,
}: SolvedBarProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIdx === null) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpenIdx(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openIdx]);

  // Render solved squircles in the order the player actually found them.
  const order: number[] = [];
  for (const g of guessHistory) {
    if (!g.correct) continue;
    const themeIdx = g.themes[0];
    if (themeIdx !== undefined && solvedThemes.has(themeIdx) && !order.includes(themeIdx)) {
      order.push(themeIdx);
    }
  }
  for (const themeIdx of solvedThemes) {
    if (!order.includes(themeIdx)) order.push(themeIdx);
  }

  if (order.length === 0) return null;

  return (
    <div
      ref={ref}
      className={`solved-bar solved-bar--${orientation}`}
      data-testid="solved-bar"
    >
      {orientation === 'vertical' && <div className="solved-bar-label">SOLVED</div>}
      {order.map((themeIdx) => {
        const themeTracks = tracks.filter((t) => t.themeIdx === themeIdx);
        const isOpen = openIdx === themeIdx;
        return (
          <div key={themeIdx} className="solved-squircle-wrap">
            <button
              type="button"
              className={`solved-squircle theme-${themeIdx}`}
              onClick={() => setOpenIdx(isOpen ? null : themeIdx)}
              aria-expanded={isOpen}
              aria-label={`Solved: ${themes[themeIdx].theme}`}
              data-testid={`solved-squircle-${themeIdx}`}
            >
              <span aria-hidden="true">{SIDES[themeIdx]}</span>
            </button>
            {isOpen && (
              <div
                className={`solved-popover solved-popover--${orientation} theme-${themeIdx}`}
                role="dialog"
                data-testid={`solved-popover-${themeIdx}`}
              >
                <div className="solved-popover-theme">{themes[themeIdx].theme}</div>
                <ul className="solved-popover-tracks">
                  {themeTracks.map((t, i) => {
                    const playing = playingId === t.id;
                    return (
                      <li key={t.id} className="solved-popover-track">
                        <button
                          type="button"
                          className={`solved-play-btn${playing ? ' playing' : ''}`}
                          onClick={() => onPlay(t.id)}
                          aria-label={playing ? `Pause ${t.title}` : `Play ${t.title}`}
                          aria-pressed={playing}
                          data-testid={`solved-popover-play-${t.id}`}
                        >
                          <span className="solved-play-icon" aria-hidden="true" />
                        </button>
                        <span className="solved-popover-text">
                          <span className="solved-popover-no">{String(i + 1).padStart(2, '0')}.</span>{' '}
                          <span className="solved-popover-title">{t.title}</span>
                          <span className="solved-popover-artist"> — {t.artist}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
