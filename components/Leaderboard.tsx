'use client';

import type { LeaderboardAvailability, LeaderboardScore } from '@/lib/types';

interface LeaderboardProps {
  availability: LeaderboardAvailability;
  loading: boolean;
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

function getLeaderboardMessage(availability: LeaderboardAvailability, loading: boolean, scoresLength: number): string | null {
  if (loading) {
    return 'Loading leaderboard…';
  }

  if (availability === 'not_configured') {
    return 'Leaderboard unavailable.';
  }

  if (availability === 'unavailable') {
    return 'Leaderboard temporarily unavailable.';
  }

  if (scoresLength === 0) {
    return 'No submissions today yet.';
  }

  return null;
}

export function Leaderboard({ availability, loading, scores, title, timeZone }: LeaderboardProps) {
  const message = getLeaderboardMessage(availability, loading, scores.length);
  const canShowScores = availability === 'ready' && !loading && scores.length > 0;

  return (
    <section className="leaderboard" aria-live="polite">
      <div className="leaderboard-header">
        <h2>{title}</h2>
        <p className="muted">Timezone: {timeZone}</p>
      </div>

      {message && <p className={availability === 'unavailable' ? 'error-text' : 'muted'}>{message}</p>}

      {canShowScores && (
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
