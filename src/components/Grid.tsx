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
  return (
    <div className="grid" data-testid="grid">
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
