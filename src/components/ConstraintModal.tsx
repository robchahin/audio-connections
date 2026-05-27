import { useEffect, useRef } from 'react';

interface ConstraintModalProps {
  constraint: string;
  onDismiss: () => void;
}

/** Pops on every load of a puzzle that has a constraint set. The constraint
 *  is a puzzle-wide meta-theme that every track obeys — players see this
 *  before they touch the grid so the rule is in their head from the start.
 *  Esc, the OK button, and clicking the backdrop all dismiss. */
export function ConstraintModal({ constraint, onDismiss }: ConstraintModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss]);

  // Move focus to the dialog on mount so screen readers announce it and
  // keyboard users can immediately Esc out.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      className="constraint-modal-backdrop"
      onClick={onDismiss}
      data-testid="constraint-modal-backdrop"
    >
      <div
        ref={dialogRef}
        className="constraint-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="constraint-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        data-testid="constraint-modal"
      >
        <div className="constraint-modal-eyebrow" id="constraint-modal-title">
          The DJ left these words on a spare piece of paper
        </div>
        <div className="constraint-modal-quote" data-testid="constraint-modal-text">
          &ldquo;{constraint}&rdquo;
        </div>
        <button
          type="button"
          className="constraint-modal-ok"
          onClick={onDismiss}
          data-testid="constraint-modal-ok"
          autoFocus
        >
          GOT IT &#9656;
        </button>
      </div>
    </div>
  );
}
