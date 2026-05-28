interface ControlsProps {
  selectedCount: number;
  gameOver: boolean;
  won: boolean;
  onDeselect: () => void;
  onSubmit: () => void;
}

export function Controls({ selectedCount, gameOver, won, onDeselect, onSubmit }: ControlsProps) {
  const submitText = gameOver
    ? won
      ? 'SOLVED'
      : 'GAME OVER'
    : `SUBMIT ${selectedCount}/4`;
  return (
    <div className="controls">
      <button
        type="button"
        className="action secondary"
        onClick={onDeselect}
        disabled={gameOver || selectedCount === 0}
        data-testid="deselect-btn"
      >
        <span className="action__face">
          <span>DESELECT</span>
          <span className="key-stripe">EJECT ◁</span>
        </span>
      </button>
      <button
        type="button"
        className="action primary"
        onClick={onSubmit}
        disabled={gameOver || selectedCount !== 4}
        data-testid="submit-btn"
      >
        <span className="action__face">
          <span>{submitText}</span>
          <span className="key-stripe">▷▷ PLAY</span>
        </span>
      </button>
    </div>
  );
}
