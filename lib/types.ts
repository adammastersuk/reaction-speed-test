export type GameStatus = 'idle' | 'waiting' | 'go' | 'result' | 'tooSoon';

export type LeaderboardAvailability = 'ready' | 'not_configured' | 'unavailable';

export interface LeaderboardScore {
  id: number;
  name: string;
  reaction_time_ms: number;
  created_at: string;
}

export interface LeaderboardResponse {
  availability: LeaderboardAvailability;
  leaderboardLabel: string;
  timeZone: string;
  scores: LeaderboardScore[];
}

export interface SaveScoreResponse {
  score: LeaderboardScore;
}

export interface ApiErrorResponse {
  message: string;
}
