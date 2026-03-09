-- Supports global all-time Top 5 query ordered by reaction time, then created_at, then id.
CREATE INDEX IF NOT EXISTS reaction_scores_global_leaderboard_idx
  ON reaction_scores (reaction_time_ms ASC, created_at ASC, id ASC);

-- Legacy daily index is no longer required for leaderboard reads.
DROP INDEX IF EXISTS reaction_scores_daily_leaderboard_idx;
