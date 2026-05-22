import { useEffect, useState } from 'react';
import { Tile } from '../Tile';
import { displayTrack } from './displayTrack';

interface IntroCard2Props {
  playKey: number;
  variant: 'mobile' | 'desktop';
}

// A softball "cat" category so the demo telegraphs how categories work. The
// player never submits, so accuracy doesn't matter — what matters is that
// the shared theme is obvious from the titles alone.
const TILES = [
  { label: 'Stray Cat Strut', themeIdx: 0 },
  { label: 'Year of the Cat', themeIdx: 0 },
  { label: 'Honky Cat', themeIdx: 0 },
  { label: 'Cool for Cats', themeIdx: 0 },
];

export function IntroCard2({ playKey, variant }: IntroCard2Props) {
  const [cuedCount, setCuedCount] = useState(0);

  useEffect(() => {
    setCuedCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    [900, 1450, 2000, 2550].forEach((t, i) => {
      timers.push(setTimeout(() => setCuedCount(i + 1), t));
    });
    return () => timers.forEach(clearTimeout);
  }, [playKey]);

  const submitHot = cuedCount === 4;

  return (
    <div className={`intro-card intro-card--rules intro-card--${variant}`} key={playKey}>
      <div className="intro-eyebrow">How to play</div>
      <h2 className="intro-title intro-title--rules">
        FIND FOUR
        <br />
        GROUPS OF FOUR.
      </h2>
      <p className="intro-body">
        Select four matching songs with the{' '}
        <span className="intro-inline-cue">CUE</span> button, then hit Submit. Find
        all four groups to win.
      </p>

      <div className="intro-demo">
        <div className="intro-demo-grid">
          {TILES.map((t, i) => (
            <Tile
              key={i}
              track={displayTrack(i, t.themeIdx, t.label)}
              index={i}
              selected={i < cuedCount}
              playing={false}
              exiting={false}
              matched={false}
              note={t.label}
              progress={0}
              disabled={false}
              displayOnly
              onPlay={() => {}}
              onSelect={() => {}}
              onNoteChange={() => {}}
            />
          ))}
        </div>
        <div className="intro-demo-counter">
          <div className="intro-demo-counter-label">Cued</div>
          <div className="intro-demo-counter-num">
            <span className="intro-demo-counter-big">{cuedCount}</span>
            <span className="intro-demo-counter-of">/ 4</span>
          </div>
          <div className="intro-demo-counter-pips">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`intro-demo-pip${i < cuedCount ? ' lit' : ''}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="intro-rules-footer">
        <div className="intro-eyebrow intro-eyebrow--sub">Then&hellip;</div>
        <button
          type="button"
          className={`action primary intro-submit${submitHot ? ' hot' : ''}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          SUBMIT {cuedCount} / 4
        </button>
      </div>
    </div>
  );
}
