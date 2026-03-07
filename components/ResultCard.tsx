'use client';

interface ResultCardProps {
  reactionTimeMs: number;
  feedback: string;
}

export function ResultCard({ reactionTimeMs, feedback }: ResultCardProps) {
  return (
    <section className="result-card" aria-live="polite">
      <p className="result-label">Reaction time</p>
      <p className="result-value">{reactionTimeMs} ms</p>
      <p className="result-feedback">{feedback}</p>
    </section>
  );
}
