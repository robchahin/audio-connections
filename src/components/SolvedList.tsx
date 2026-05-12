import type { LoadedTrack, Theme } from '../types';

interface SolvedListProps {
  themes: Theme[];
  solvedThemes: Set<number>;
  tracks: LoadedTrack[];
}

export function SolvedList({ themes, solvedThemes, tracks }: SolvedListProps) {
  return (
    <div className="solved" data-testid="solved">
      {[...solvedThemes].map((themeIdx) => {
        const themeTracks = tracks.filter((t) => t.themeIdx === themeIdx);
        return (
          <div key={themeIdx} className={`solved-row theme-${themeIdx}`} data-testid={`solved-row-${themeIdx}`}>
            <div className="solved-theme">{themes[themeIdx].theme}</div>
            <div className="solved-tracks">
              {themeTracks.map((t) => (
                <div key={t.id} className="solved-track-item">
                  <span className="solved-title">{t.title}</span>
                  <span className="solved-artist"> — {t.artist}</span>
                  {t.note && <span className="solved-note"> ({t.note})</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
