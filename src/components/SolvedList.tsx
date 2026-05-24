import type { Guess, LoadedTrack, Theme } from '../types';

interface SolvedListProps {
  themes: Theme[];
  solvedThemes: Set<number>;
  tracks: LoadedTrack[];
  guessHistory: Guess[];
  playingId: number | null;
  onPlay: (id: number) => void;
}

const SIDES = ['A', 'B', 'C', 'D'];

export function SolvedList({
  themes,
  solvedThemes,
  tracks,
  guessHistory,
  playingId,
  onPlay,
}: SolvedListProps) {
  // Render rows in the order the player actually found the groups.
  // solvedThemes is derived in theme-index order, so reconstruct solve
  // order from the correct guesses (persisted, so it survives reload),
  // then append any solved-but-not-found themes — the loss auto-reveal —
  // in theme order behind them.
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

  return (
    <div className="solved" data-testid="solved">
      {order.map((themeIdx) => {
        const themeTracks = tracks.filter((t) => t.themeIdx === themeIdx);
        return (
          <div
            key={themeIdx}
            className={`solved-row theme-${themeIdx}`}
            data-side={SIDES[themeIdx]}
            data-testid={`solved-row-${themeIdx}`}
          >
            <div className="solved-side-badge" aria-hidden="true">
              SIDE {SIDES[themeIdx]}
            </div>
            <div className="solved-theme">
              <span>{themes[themeIdx].theme}</span>
            </div>
            <div className="solved-tracks">
              {themeTracks.map((t, i) => {
                const playing = playingId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`solved-track-item${playing ? ' playing' : ''}`}
                    onClick={() => onPlay(t.id)}
                    aria-label={playing ? `Pause ${t.title}` : `Play ${t.title}`}
                    aria-pressed={playing}
                    data-testid={`solved-play-${t.id}`}
                  >
                    <span className="solved-track-glyph" aria-hidden="true">
                      {playing ? '▮' : '▸'}
                    </span>
                    <span className="solved-track-no">{String(i + 1).padStart(2, '0')}.</span>
                    <span className="solved-track-text">
                      <span className="solved-title">{t.title}</span>
                      <span className="solved-artist"> — {t.artist}</span>
                      {t.note && <span className="solved-note"> ({t.note})</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
