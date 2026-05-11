import { useEffect, useState } from 'react';
import type { Puzzle } from '../types';
import { isReleased } from '../puzzles';

interface CountdownProps {
  puzzles: Puzzle[];
  onUnlock: () => void;
}

function format(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return days > 0
    ? `${days}d ${hours}h ${minutes}m`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function Countdown({ puzzles, onUnlock }: CountdownProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    let active = true;
    let unlocked = false;
    function tick() {
      if (!active) return;
      const next = puzzles.find((p) => !isReleased(p));
      if (!next || !next.releaseAt) {
        setText('');
        return;
      }
      const ms = new Date(next.releaseAt).getTime() - Date.now();
      if (ms <= 0) {
        setText('');
        if (!unlocked) {
          unlocked = true;
          onUnlock();
        }
        return;
      }
      setText(`Day ${next.day} unlocks in ${format(ms)}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [puzzles, onUnlock]);

  return (
    <div className="unlock-countdown" data-testid="countdown">
      {text}
    </div>
  );
}
