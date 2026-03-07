# Reaction Speed Test (Next.js)

A polished, production-ready reaction speed test built with Next.js App Router and TypeScript.

## Features

- Clean reaction test loop: **Idle → Waiting → Go → Result / Too Soon**
- Randomized start delay with safe timer cleanup
- Mouse + touch friendly interaction via one large responsive panel
- Mobile-focused layout (no fixed controls that can hide key actions)
- Optional leaderboard backed by Neon/Postgres (fastest times first)
- Accessible copy, large tap targets, reduced-motion support

## Tech Stack

- Next.js (App Router)
- TypeScript
- CSS (single global stylesheet for straightforward maintenance)
- Postgres via `postgres` package (optional)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. (Optional) Enable leaderboard by creating `.env.local`:

```bash
cp .env.example .env.local
```

Then set `POSTGRES_URL` to your Neon/Postgres connection string.

3. Run development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Database Setup (Optional Leaderboard)

Run the SQL in `db/schema.sql` against your database:

```sql
CREATE TABLE IF NOT EXISTS reaction_scores (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(24) NOT NULL,
  reaction_time_ms INTEGER NOT NULL CHECK (reaction_time_ms > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reaction_scores_ranking_idx
  ON reaction_scores (reaction_time_ms ASC, created_at ASC);
```

If `POSTGRES_URL` is missing, the app still works fully, but score submission is hidden and API reads return leaderboard disabled.

## API Endpoints

- `GET /api/scores`
  - Returns `{ enabled, scores }`
- `POST /api/scores`
  - Accepts `{ name, reactionTimeMs }`
  - Uses the displayed final result value for submission

## Deployment (Vercel)

1. Push repo to GitHub.
2. Import into Vercel.
3. Add `POSTGRES_URL` in Project Settings → Environment Variables (optional leaderboard).
4. Deploy.

## Project Structure

- `app/page.tsx` — game container and client-side state machine
- `components/` — game panel, result card, leaderboard sections
- `app/api/scores/route.ts` — leaderboard API handlers
- `lib/db.ts` — database helper (optional)
- `lib/feedback.ts` — concise result tier messages
- `db/schema.sql` — SQL schema for leaderboard table

## Notes on Robustness

- Timers are cleared on restart and unmount to prevent stale callbacks.
- Round IDs guard against delayed timer callbacks mutating new rounds.
- Input typing for name field is isolated; no keyboard shortcuts are used.
- Early click detection cleanly transitions to “Too soon” state.
