-- Supports daily Top 5 query filtered by created_at range with deterministic tie ordering.
CREATE INDEX IF NOT EXISTS reaction_scores_daily_leaderboard_idx
  ON reaction_scores (created_at, reaction_time_ms ASC, id ASC);

-- Optional cleanup of legacy index if present.
DROP INDEX IF EXISTS reaction_scores_ranking_idx;
