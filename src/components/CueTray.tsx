import { useState } from 'react';
import type { LoadedTrack } from '../types';
import type { ChromeOrientation } from './SolvedBar';

interface CueTrayProps {
  tracks: LoadedTrack[];
  selected: Set<number>;
  notes: Map<number, string>;
  orientation: ChromeOrientation;
  onDeselect: (id: number) => void;
}

/** Mobile chrome: shows the number of currently-cued tracks plus 4 indicator
 *  dots. Tapping toggles an expanded list of the cued tiles. In landscape
 *  this stacks vertically and the expanded list opens leftward (overlays
 *  the grid); in portrait it stays a horizontal bar and the expanded list
 *  opens upward. */
export function CueTray({ tracks, selected, notes, orientation, onDeselect }: CueTrayProps) {
  const [expanded, setExpanded] = useState(false);
  const count = selected.size;
  const cuedTracks = tracks.filter((t) => selected.has(t.id));

  return (
    <div className={`cue-tray cue-tray--${orientation}`} data-testid="cue-tray">
      <button
        type="button"
        className="cue-tray-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        data-testid="cue-tray-toggle"
      >
        <span className={`cue-tray-count${count > 0 ? ' on' : ''}`}>
          {count} CUED
        </span>
        <span className="cue-tray-dots" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`cue-tray-dot${i < count ? ' on' : ''}`} />
          ))}
        </span>
      </button>
      {expanded && count > 0 && (
        <div
          className={`cue-tray-expand cue-tray-expand--${orientation}`}
          data-testid="cue-tray-expand"
        >
          <ul className="cue-tray-list">
            {cuedTracks.map((t) => (
              <li key={t.id} className="cue-tray-item">
                <span className="cue-tray-item-note">
                  {notes.get(t.id) || <em className="cue-tray-item-placeholder">(no title)</em>}
                </span>
                <button
                  type="button"
                  className="cue-tray-uncue"
                  onClick={() => onDeselect(t.id)}
                  aria-label={`Uncue track ${t.id}`}
                  data-testid={`cue-tray-uncue-${t.id}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
