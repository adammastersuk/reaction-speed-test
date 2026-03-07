import { NextResponse } from 'next/server';

import { getTopScores, insertScore, isLeaderboardEnabled } from '@/lib/db';
import { getAppTimeZone } from '@/lib/timezone';

const MAX_NAME_LENGTH = 24;
const TOP_FIVE_LIMIT = 5;

export const dynamic = 'force-dynamic';

export async function GET() {
  const timeZone = getAppTimeZone();

  if (!isLeaderboardEnabled()) {
    return NextResponse.json({ enabled: false, leaderboardLabel: "Today's Top 5", timeZone, scores: [] });
  }

  const scores = await getTopScores({ limit: TOP_FIVE_LIMIT, timeZone });
  return NextResponse.json({ enabled: true, leaderboardLabel: "Today's Top 5", timeZone, scores });
}

export async function POST(request: Request) {
  if (!isLeaderboardEnabled()) {
    return NextResponse.json(
      { message: 'Leaderboard is disabled. Set POSTGRES_URL to enable it.' },
      { status: 503 }
    );
  }

  const body = (await request.json()) as { name?: string; reactionTimeMs?: unknown };
  const name = (body.name ?? '').trim();
  const reactionTimeMs = Number(body.reactionTimeMs);

  if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { message: `Name must be between 2 and ${MAX_NAME_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (!Number.isFinite(reactionTimeMs) || reactionTimeMs < 1 || reactionTimeMs > 5000) {
    return NextResponse.json(
      { message: 'Reaction time is invalid.' },
      { status: 400 }
    );
  }

  const score = await insertScore({
    name,
    reactionTimeMs: Math.round(reactionTimeMs),
  });

  return NextResponse.json({ score }, { status: 201 });
}
