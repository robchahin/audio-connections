import { useEffect, useState } from 'react';
import type { LoadedTrack } from '../../types';
import { Tile, type PeelState } from '../Tile';

interface IntroCard4Props {
  playKey: number;
  variant: 'mobile' | 'desktop';
}

const DEMO_TRACK: LoadedTrack = {
  id: 0,
  themeIdx: 0,
  previewUrl: '',
  artist: 'Toto',
  title: 'Africa',
};

// Sequence the demo peel: arm at T_ARM, commit at T_REVEAL, then sit on
// the revealed state until the user advances. Restarts on playKey.
const T_ARM = 1100;
const T_REVEAL = 2400;

export function IntroCard4({ playKey, variant }: IntroCard4Props) {
  const [peel, setPeel] = useState<PeelState>('idle');

  useEffect(() => {
    setPeel('idle');
    const arm = setTimeout(() => setPeel('armed'), T_ARM);
    const reveal = setTimeout(() => setPeel('revealed'), T_REVEAL);
    return () => {
      clearTimeout(arm);
      clearTimeout(reveal);
    };
  }, [playKey]);

  return (
    <div className={`intro-card intro-card--peel intro-card--${variant}`} key={playKey}>
      <div className="intro-eyebrow">Don&rsquo;t know that song?</div>
      <h2 className="intro-title intro-title--rules">PEEL TO REVEAL</h2>
      <p className="intro-body">
        Click on the corner of any tape to reveal the artist and song
        title - but we aren&rsquo;t telling you what the category is!
      </p>

      <div className="intro-demo intro-demo--peel">
        <div className="intro-peel-tile">
          <Tile
            track={DEMO_TRACK}
            index={0}
            selected={false}
            playing={false}
            exiting={false}
            matched={false}
            note=""
            progress={0}
            disabled={false}
            displayOnly
            displayPeelState={peel}
            onPlay={() => {}}
            onSelect={() => {}}
            onNoteChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
