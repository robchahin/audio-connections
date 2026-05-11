import { useEffect, useRef } from 'react';
import type { LoadedTrack } from '../types';
import { Tile } from './Tile';

interface GridProps {
  tracks: LoadedTrack[];
  selected: Set<number>;
  solvedThemes: Set<number>;
  exitingThemes: Set<number>;
  playingId: number | null;
  playProgress: number;
  notes: Map<number, string>;
  disabled: boolean;
  onPlay: (id: number) => void;
  onSelect: (id: number) => void;
  onNoteChange: (id: number, value: string) => void;
}

export function Grid({
  tracks,
  selected,
  solvedThemes,
  exitingThemes,
  playingId,
  playProgress,
  notes,
  disabled,
  onPlay,
  onSelect,
  onNoteChange,
}: GridProps) {
  // Keep exiting tiles in the DOM during their fade so they animate out
  // before being removed; matches the legacy 400ms delay behavior.
  const visible = tracks.filter(
    (t) => !solvedThemes.has(t.themeIdx) || exitingThemes.has(t.themeIdx),
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const centeredRef = useRef(false);

  // On initial load (and on day switch, which empties then refills the grid),
  // center the horizontal scroll position so the middle columns are visible
  // when the grid is wider than its container.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (visible.length === 0) {
      centeredRef.current = false;
      return;
    }
    if (centeredRef.current) return;
    if (grid.scrollWidth > grid.clientWidth) {
      grid.scrollLeft = (grid.scrollWidth - grid.clientWidth) / 2;
    }
    centeredRef.current = true;
  }, [visible.length]);

  return (
    <div className="grid" data-testid="grid" ref={gridRef}>
      {visible.map((track, idx) => (
        <Tile
          key={track.id}
          track={track}
          index={idx}
          selected={selected.has(track.id)}
          playing={playingId === track.id}
          exiting={exitingThemes.has(track.themeIdx)}
          note={notes.get(track.id) ?? ''}
          progress={playingId === track.id ? playProgress : 0}
          disabled={disabled}
          onPlay={() => onPlay(track.id)}
          onSelect={() => onSelect(track.id)}
          onNoteChange={(val) => onNoteChange(track.id, val)}
        />
      ))}
    </div>
  );
}
