import postgres from 'postgres';

import { getAppTimeZone } from '@/lib/timezone';

const DEFAULT_TOP_SCORES_LIMIT = 5;

const connectionString = process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim() || '';

const sql = connectionString
  ? postgres(connectionString.replace(/^psql:\/\//, 'postgres://'), {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null;

export interface InsertScoreInput {
  name: string;
  reactionTimeMs: number;
}

export interface LeaderboardScoreRow {
  id: number;
  name: string;
  reaction_time_ms: number;
  created_at: string;
}

interface TopScoresOptions {
  limit?: number;
  timeZone?: string;
}

export function isLeaderboardConfigured(): boolean {
  return Boolean(sql);
}

export async function isLeaderboardReachable(): Promise<boolean> {
  if (!sql) {
    return false;
  }

  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function getTopScores(options: TopScoresOptions = {}): Promise<LeaderboardScoreRow[]> {
  if (!sql) {
    return [];
  }

  const limit = options.limit ?? DEFAULT_TOP_SCORES_LIMIT;
  const timeZone = options.timeZone ?? getAppTimeZone();

  return sql<LeaderboardScoreRow[]>`
    SELECT id, name, reaction_time_ms, created_at
    FROM reaction_scores
    WHERE created_at >= date_trunc('day', now() AT TIME ZONE ${timeZone}) AT TIME ZONE ${timeZone}
      AND created_at < (date_trunc('day', now() AT TIME ZONE ${timeZone}) + interval '1 day') AT TIME ZONE ${timeZone}
    ORDER BY reaction_time_ms ASC, created_at ASC, id ASC
    LIMIT ${limit}
  `;
}

export async function insertScore(input: InsertScoreInput) {
  if (!sql) {
    throw new Error('Leaderboard is unavailable.');
  }

  const [row] = await sql<LeaderboardScoreRow[]>`
    INSERT INTO reaction_scores (name, reaction_time_ms)
    VALUES (${input.name}, ${input.reactionTimeMs})
    RETURNING id, name, reaction_time_ms, created_at
  `;

  return row;
}
