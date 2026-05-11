import type { Puzzle } from '../types';
import { isReleased } from '../puzzles';

interface DaySelectorProps {
  puzzles: Puzzle[];
  currentIndex: number;
  onSwitch: (idx: number) => void;
}

export function DaySelector({ puzzles, currentIndex, onSwitch }: DaySelectorProps) {
  return (
    <div className="day-selector" data-testid="day-selector">
      {puzzles.map((p, idx) => {
        const released = isReleased(p);
        const classes = [
          'day-btn',
          idx === currentIndex && 'active',
          !released && 'locked',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={p.day}
            type="button"
            className={classes}
            disabled={!released}
            title={!released && p.releaseAt ? `Unlocks ${new Date(p.releaseAt).toUTCString()}` : undefined}
            onClick={() => released && onSwitch(idx)}
            data-testid={`day-btn-${p.day}`}
          >
            Day {p.day}{!released ? ' 🔒' : ''}
          </button>
        );
      })}
    </div>
  );
}
