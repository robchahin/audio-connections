import { useState } from 'react';
import type { Guess } from '../types';
import { THEME_EMOJI } from '../puzzles';

interface EndPanelProps {
  won: boolean;
  day: number;
  guessHistory: Guess[];
}

function buildShareText(day: number, guessHistory: Guess[]): string {
  const lines = [`Audio Connections ${day}`];
  for (const g of guessHistory) {
    lines.push(g.themes.map((t) => THEME_EMOJI[t]).join(''));
  }
  return lines.join('\n');
}

export function EndPanel({ won, day, guessHistory }: EndPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyText, setCopyText] = useState('Copy result');
  const shareText = buildShareText(day, guessHistory);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setCopyText('Copied!');
      setTimeout(() => {
        setCopied(false);
        setCopyText('Copy result');
      }, 1500);
    } catch {
      setCopyText('Copy failed — select text manually');
    }
  };

  return (
    <div className={`end-panel ${won ? 'win' : 'loss'}`} data-testid="end-panel">
      <h2>{won ? 'Solved!' : 'Game over'}</h2>
      <div className="share-text" data-testid="share-text">{shareText}</div>
      <button
        type="button"
        className={`copy-btn${copied ? ' copied' : ''}`}
        onClick={handleCopy}
        data-testid="copy-btn"
      >
        {copyText}
      </button>
    </div>
  );
}
