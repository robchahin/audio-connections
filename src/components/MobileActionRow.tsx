import type { ChromeOrientation } from './SolvedBar';

interface MobileActionRowProps {
  mistakes: number;
  maxMistakes: number;
  selectedCount: number;
  gameOver: boolean;
  won: boolean;
  orientation: ChromeOrientation;
  onDeselect: () => void;
  onSubmit: () => void;
}

/** Mobile chrome: mistakes indicator + Deselect/Submit buttons.
 *  Portrait: mistakes row above buttons row (compact bottom stack).
 *  Landscape: same elements stacked vertically in the right-edge column. */
export function MobileActionRow({
  mistakes,
  maxMistakes,
  selectedCount,
  gameOver,
  won,
  orientation,
  onDeselect,
  onSubmit,
}: MobileActionRowProps) {
  // Text format matches Controls so the same test selectors work at both
  // desktop and mobile (only one of the two renders at any viewport).
  const submitText = gameOver ? (won ? 'SOLVED' : 'GAME OVER') : `SUBMIT ${selectedCount}/4`;
  return (
    <div className={`mar mar--${orientation}`} data-testid="mobile-action-row">
      <div className="mar-mistakes" data-testid="mistakes-dots">
        <span className="mar-mistakes-label">MISTAKES</span>
        <span className="mar-mistakes-strip" aria-hidden="true">
          {Array.from({ length: maxMistakes }, (_, i) => {
            const lit = i < maxMistakes - mistakes;
            return <span key={i} className={`mar-mistake-dot${lit ? ' lit' : ''}`} />;
          })}
        </span>
        <span className="mar-mistakes-left">{maxMistakes - mistakes} LEFT</span>
      </div>
      <div className="mar-buttons">
        <button
          type="button"
          className="mar-btn mar-btn-deselect"
          onClick={onDeselect}
          disabled={gameOver || selectedCount === 0}
          data-testid="deselect-btn"
        >
          DESELECT
        </button>
        <button
          type="button"
          className="mar-btn mar-btn-submit"
          onClick={onSubmit}
          disabled={gameOver || selectedCount !== 4}
          data-testid="submit-btn"
        >
          {submitText}
        </button>
      </div>
    </div>
  );
}
