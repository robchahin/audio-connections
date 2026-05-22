import type { LoadedTrack } from '../types';
import { CassetteDeck } from './CassetteDeck';

interface TileProps {
  track: LoadedTrack;
  index: number;
  selected: boolean;
  playing: boolean;
  exiting: boolean;
  matched: boolean;
  note: string;
  progress: number;
  disabled: boolean;
  /** Intro/demo mode: render every visual state but reject pointer + keyboard
   *  input. Differs from `disabled`, which dims the controls. */
  displayOnly?: boolean;
  onPlay: () => void;
  onSelect: () => void;
  onNoteChange: (val: string) => void;
}

export function Tile({
  track,
  index,
  selected,
  playing,
  exiting,
  matched,
  note,
  progress,
  disabled,
  displayOnly = false,
  onPlay,
  onSelect,
  onNoteChange,
}: TileProps) {
  const tileClass = [
    'tile',
    selected && 'selected',
    playing && 'playing',
    exiting && 'exiting',
    matched && 'matched',
    matched && `matched-theme-${track.themeIdx}`,
    displayOnly && 'display-only',
  ]
    .filter(Boolean)
    .join(' ');

  const progressPct = Math.min(100, progress * 100);

  return (
    <div
      className={tileClass}
      data-track-id={track.id}
      data-testid={displayOnly ? undefined : `tile-${track.id}`}
      aria-hidden={displayOnly || undefined}
    >
      <span className="tile-screw tl" />
      <span className="tile-screw tr" />
      <span className="tile-screw bl" />
      <span className="tile-screw br" />

      <div className="tile-label">
        <div className="tile-track-no">C-90 · TYPE II</div>
        <textarea
          className="tile-label-input"
          placeholder="write title…"
          rows={2}
          value={note}
          readOnly={displayOnly}
          tabIndex={displayOnly ? -1 : undefined}
          onChange={displayOnly ? undefined : (e) => onNoteChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter inserts a newline (multi-line notes like "Song\nArtist");
            // focus changes only on click/touch. Escape commits/blurs.
            if (e.key === 'Escape') {
              e.preventDefault();
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          onBlur={(e) => {
            // Once not editing, show the note from the top so a long title
            // reads from its start rather than scrolled to the caret.
            e.target.scrollTop = 0;
          }}
          aria-label={`Note for track ${index + 1}`}
        />
      </div>

      <CassetteDeck playing={playing} progress={progress} />

      <div className="tile-actions">
        <button
          type="button"
          className={`play-btn${playing ? ' playing' : ''}`}
          onClick={displayOnly ? undefined : onPlay}
          disabled={disabled}
          tabIndex={displayOnly ? -1 : undefined}
          aria-label={playing ? 'Pause' : 'Play'}
          data-testid={displayOnly ? undefined : `play-${track.id}`}
        >
          <span className="icon" />
          <span>{playing ? 'STOP' : 'PLAY'}</span>
        </button>
        <button
          type="button"
          className="select-btn"
          onClick={displayOnly ? undefined : onSelect}
          disabled={disabled}
          tabIndex={displayOnly ? -1 : undefined}
          data-testid={displayOnly ? undefined : `select-${track.id}`}
        >
          CUE
        </button>
      </div>

      <div className="tile-progress">
        <div className="tile-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
}
