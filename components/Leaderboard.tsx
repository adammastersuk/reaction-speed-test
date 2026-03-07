'use client';

import type { LeaderboardScore } from '@/lib/types';

interface LeaderboardProps {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  scores: LeaderboardScore[];
}

export function Leaderboard({ enabled, loading, error, scores }: LeaderboardProps) {
  if (!enabled) {
    return (
      <section className="leaderboard">
        <h2>Leaderboard</h2>
        <p className="muted">Leaderboard is optional. Add a database connection to enable score saving.</p>
      </section>
    );
  }

  return (
    <section className="leaderboard">
      <h2>Leaderboard</h2>
      {loading && <p className="muted">Loading scores…</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && scores.length === 0 && <p className="muted">No scores yet. Set the first benchmark.</p>}
      {!loading && !error && scores.length > 0 && (
        <ol className="score-list">
          {scores.map((score, index) => (
            <li key={score.id} className="score-item">
              <span>{index + 1}. {score.name}</span>
              <strong>{score.reaction_time_ms} ms</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
