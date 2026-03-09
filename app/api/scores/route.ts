import { NextResponse } from 'next/server';

import { getTopScores, insertScore, isLeaderboardConfigured, isLeaderboardReachable } from '@/lib/db';
import type { ApiErrorResponse, LeaderboardResponse, SaveScoreResponse } from '@/lib/types';

const MAX_NAME_LENGTH = 24;
const TOP_TEN_LIMIT = 10;

export const dynamic = 'force-dynamic';

function getBasePayload() {
  return {
    leaderboardLabel: 'All-Time Top 10',
  };
}

export async function GET() {
  if (!isLeaderboardConfigured()) {
    const payload: LeaderboardResponse = {
      ...getBasePayload(),
      availability: 'not_configured',
      scores: [],
    };

    return NextResponse.json(payload);
  }

  if (!(await isLeaderboardReachable())) {
    const payload: LeaderboardResponse = {
      ...getBasePayload(),
      availability: 'unavailable',
      scores: [],
    };

    return NextResponse.json(payload, { status: 503 });
  }

  try {
    const scores = await getTopScores({ limit: TOP_TEN_LIMIT });
    const payload: LeaderboardResponse = {
      ...getBasePayload(),
      availability: 'ready',
      scores,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Failed to load leaderboard scores:', error);

    const payload: LeaderboardResponse = {
      ...getBasePayload(),
      availability: 'unavailable',
      scores: [],
    };

    return NextResponse.json(payload, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isLeaderboardConfigured()) {
    const payload: ApiErrorResponse = {
      message: 'Leaderboard unavailable.',
    };

    return NextResponse.json(payload, { status: 503 });
  }

  if (!(await isLeaderboardReachable())) {
    const payload: ApiErrorResponse = {
      message: 'Leaderboard temporarily unavailable.',
    };

    return NextResponse.json(payload, { status: 503 });
  }

  const body = (await request.json()) as { name?: string; reactionTimeMs?: unknown };
  const name = (body.name ?? '').trim();
  const reactionTimeMs = Number(body.reactionTimeMs);

  if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { message: `Name must be between 2 and ${MAX_NAME_LENGTH} characters.` } satisfies ApiErrorResponse,
      { status: 400 }
    );
  }

  if (!Number.isFinite(reactionTimeMs) || reactionTimeMs < 1 || reactionTimeMs > 5000) {
    return NextResponse.json({ message: 'Reaction time is invalid.' } satisfies ApiErrorResponse, { status: 400 });
  }

  try {
    const score = await insertScore({
      name,
      reactionTimeMs: Math.round(reactionTimeMs),
    });

    return NextResponse.json({ score } satisfies SaveScoreResponse, { status: 201 });
  } catch (error) {
    console.error('Failed to insert leaderboard score:', error);
    return NextResponse.json({ message: 'Leaderboard temporarily unavailable.' } satisfies ApiErrorResponse, { status: 503 });
  }
}
