import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL;

const sql =
  connectionString && connectionString.trim().length > 0
    ? postgres(connectionString, { ssl: 'require' })
    : null;

export function isLeaderboardEnabled(): boolean {
  return Boolean(sql);
}

export interface InsertScoreInput {
  name: string;
  reactionTimeMs: number;
}

export async function getTopScores(limit = 10) {
  if (!sql) {
    return [];
  }

  return sql<{
    id: number;
    name: string;
    reaction_time_ms: number;
    created_at: string;
  }[]>`
    SELECT id, name, reaction_time_ms, created_at
    FROM reaction_scores
    ORDER BY reaction_time_ms ASC, created_at ASC
    LIMIT ${limit}
  `;
}

export async function insertScore(input: InsertScoreInput) {
  if (!sql) {
    throw new Error('Leaderboard is not enabled.');
  }

  const [row] = await sql<{
    id: number;
    name: string;
    reaction_time_ms: number;
    created_at: string;
  }[]>`
    INSERT INTO reaction_scores (name, reaction_time_ms)
    VALUES (${input.name}, ${input.reactionTimeMs})
    RETURNING id, name, reaction_time_ms, created_at
  `;

  return row;
}
