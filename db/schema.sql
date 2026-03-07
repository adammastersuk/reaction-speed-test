CREATE TABLE IF NOT EXISTS reaction_scores (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(24) NOT NULL,
  reaction_time_ms INTEGER NOT NULL CHECK (reaction_time_ms > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reaction_scores_daily_leaderboard_idx
  ON reaction_scores (created_at, reaction_time_ms ASC, id ASC);
