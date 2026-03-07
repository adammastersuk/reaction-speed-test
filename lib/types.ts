export type GameStatus = 'idle' | 'waiting' | 'go' | 'result' | 'tooSoon';

export interface LeaderboardScore {
  id: number;
  name: string;
  reaction_time_ms: number;
  created_at: string;
}
