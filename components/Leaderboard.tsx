'use client';

import type { LeaderboardScore } from '@/lib/types';

interface LeaderboardProps {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  scores: LeaderboardScore[];
  title: string;
  timeZone: string;
}

function formatSubmittedTime(value: string, timeZone: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone,
  }).format(date);
}

export function Leaderboard({ enabled, loading, error, scores, title, timeZone }: LeaderboardProps) {
  if (!enabled) {
    return (
      <section className="leaderboard">
        <h2>{title}</h2>
        <p className="muted">Leaderboard is optional. Add a database connection to enable score saving.</p>
      </section>
    );
  }

  return (
    <section className="leaderboard">
      <div className="leaderboard-header">
        <h2>{title}</h2>
        <p className="muted">Timezone: {timeZone}</p>
      </div>

      {loading && <p className="muted">Loading scores…</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && scores.length === 0 && (
        <p className="muted">No submissions yet today. Be the first to set the pace.</p>
      )}

      {!loading && !error && scores.length > 0 && (
        <ol className="score-list" aria-label={title}>
          {scores.map((score, index) => (
            <li key={score.id} className="score-item">
              <div className="score-main">
                <span className="score-rank" aria-label={`Rank ${index + 1}`}>
                  {index + 1}
                </span>
                <span className="score-name">{score.name}</span>
              </div>
              <div className="score-metrics">
                <strong>{score.reaction_time_ms} ms</strong>
                <span className="muted score-time">{formatSubmittedTime(score.created_at, timeZone)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
