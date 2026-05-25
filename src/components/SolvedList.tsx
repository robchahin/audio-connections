import type { Guess, LoadedTrack, Theme } from '../types';
import { appleMusicUrl, spotifyUrl } from '../musicLinks';

interface SolvedListProps {
  themes: Theme[];
  solvedThemes: Set<number>;
  tracks: LoadedTrack[];
  guessHistory: Guess[];
}

const SIDES = ['A', 'B', 'C', 'D'];

export function SolvedList({ themes, solvedThemes, tracks, guessHistory }: SolvedListProps) {
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
              {themeTracks.map((t, i) => (
                <div key={t.id} className="solved-track-item">
                  <span className="solved-track-no">{String(i + 1).padStart(2, '0')}.</span>
                  <span className="solved-track-body">
                    <span className="solved-title">{t.title}</span>
                    <span className="solved-artist"> — {t.artist}</span>
                    {t.note && <span className="solved-note"> ({t.note})</span>}
                    <span className="solved-track-links">
                      <a
                        className="solved-track-link"
                        href={appleMusicUrl(t.itunesId, t.trackViewUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open "${t.title}" by ${t.artist} in Apple Music`}
                      >
                        Apple
                      </a>
                      <a
                        className="solved-track-link"
                        href={spotifyUrl(t.artist, t.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Search Spotify for "${t.title}" by ${t.artist}`}
                      >
                        Spotify
                      </a>
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
