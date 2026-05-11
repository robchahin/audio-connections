interface MistakesDisplayProps {
  mistakes: number;
  max: number;
}

export function MistakesDisplay({ mistakes, max }: MistakesDisplayProps) {
  return (
    <div className="mistakes-row">
      Mistakes remaining:
      <div className="mistakes-dots" data-testid="mistakes-dots">
        {Array.from({ length: max }, (_, i) => {
          const used = i >= max - mistakes;
          return <div key={i} className={`mistake-dot${used ? ' used' : ''}`} />;
        })}
      </div>
    </div>
  );
}
