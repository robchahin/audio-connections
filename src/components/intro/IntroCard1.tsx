import { useEffect, useState } from 'react';
import { Tile } from '../Tile';
import { displayTrack } from './displayTrack';

interface IntroCard1Props {
  /** Bumps when the card is re-entered. Restarts the cycling-playing demo so
   *  the user sees the choreography from the top. */
  playKey: number;
  variant: 'mobile' | 'desktop';
}

// One label per theme so the matched-theme glow (if it ever shows) uses
// distinct colors. Order matches the fly-in corners below.
const TILES = [
  { label: 'Imagine', themeIdx: 0, from: { x: -240, y: -200, r: -22 } },
  { label: 'Dancing Queen', themeIdx: 1, from: { x: 240, y: -200, r: 22 } },
  { label: 'Back in Black', themeIdx: 2, from: { x: -240, y: 200, r: 18 } },
  { label: 'Bidi Bidi Bom Bom', themeIdx: 3, from: { x: 240, y: 200, r: -18 } },
];

export function IntroCard1({ playKey, variant }: IntroCard1Props) {
  const [playIdx, setPlayIdx] = useState(0);

  // After the fly-in completes (~1s), cycle which tile is "playing" so users
  // see the "only one song at a time" rule before reading any text.
  useEffect(() => {
    setPlayIdx(0);
    let cycle: ReturnType<typeof setTimeout> | undefined;
    const start = setTimeout(function tick() {
      setPlayIdx((p) => (p + 1) % TILES.length);
      cycle = setTimeout(tick, 1800);
    }, 1100);
    return () => {
      clearTimeout(start);
      if (cycle) clearTimeout(cycle);
    };
  }, [playKey]);

  const isDesktop = variant === 'desktop';

  return (
    <div className={`intro-card intro-card--title intro-card--${variant}`} key={playKey}>
      <div className={`intro-tile-stage intro-tile-stage--${isDesktop ? 'row' : 'grid'}`}>
        {TILES.map((t, i) => (
          <div
            key={i}
            className="intro-tile-slot"
            style={
              {
                '--fx': `${t.from.x}px`,
                '--fy': `${t.from.y}px`,
                '--fr': `${t.from.r}deg`,
                animationDelay: `${0.1 + i * 0.09}s`,
              } as React.CSSProperties
            }
          >
            <Tile
              track={displayTrack(i, t.themeIdx, t.label)}
              index={i}
              selected={false}
              playing={playIdx === i}
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
          </div>
        ))}
      </div>

      <h2 className="intro-title">
        {isDesktop ? (
          'AUDIO CONNECTIONS'
        ) : (
          <>
            AUDIO
            <br />
            CONNECTIONS
          </>
        )}
      </h2>
      <p className="intro-byline">
        A <em>&ldquo;match&nbsp;4&rdquo;</em> music trivia game
        {isDesktop ? ' ' : <br />}
        by Corey Farwell and friends
      </p>
    </div>
  );
}
