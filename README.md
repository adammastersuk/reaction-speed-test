# Reaction Speed Test (Next.js)

A polished, production-ready reaction speed test built with Next.js App Router and TypeScript.

## Features

- Clean reaction test loop: **Idle → Waiting → Go → Result / Too Soon**
- Randomized start delay with safe timer cleanup
- Mouse + touch friendly interaction via one large responsive panel
- Mobile-focused layout (no fixed controls that can hide key actions)
- Optional Neon/Postgres leaderboard
- **Daily leaderboard mode:** **Today's Top 5** in a server-configured timezone
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

3. Configure environment variables:

- `POSTGRES_URL` (optional): Neon/Postgres connection string.
- `APP_TIMEZONE` (required for consistent day boundaries): IANA timezone (for example `Europe/London`).

4. Run development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Database Setup (Optional Leaderboard)

Run the SQL in `db/schema.sql` against your database:

```sql
CREATE TABLE IF NOT EXISTS reaction_scores (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(24) NOT NULL,
  reaction_time_ms INTEGER NOT NULL CHECK (reaction_time_ms > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reaction_scores_daily_leaderboard_idx
  ON reaction_scores (created_at, reaction_time_ms ASC, id ASC);
```

For existing deployments, apply migration SQL in `db/migrations/2026030701_daily_top5_timezone.sql`.

## Daily Leaderboard Query Logic

- Membership is server-side only (never from client-side date filtering).
- Current day boundaries are computed inside Postgres using `APP_TIMEZONE`.
- Ranking is deterministic and stable:
  1. `reaction_time_ms ASC` (faster is better)
  2. `created_at ASC`
  3. `id ASC`
- Result size is capped at 5 rows in SQL.

## API Endpoints

- `GET /reaction-speed-test/api/scores`
  - Returns `{ enabled, leaderboardLabel, timeZone, scores }`
- `POST /reaction-speed-test/api/scores`
  - Accepts `{ name, reactionTimeMs }`
  - Uses the displayed final result value for submission

Because this app is deployed with `basePath: '/reaction-speed-test'`, API calls must include the mounted prefix in browser fetch requests.

## Vercel Setup

1. In Vercel Project → **Settings → Environment Variables**, set:
   - `POSTGRES_URL` (Production, Preview, Development where leaderboard should be enabled)
   - `APP_TIMEZONE` (Production, Preview, Development; example `Europe/London`)
2. Save variables.
3. **Redeploy** each environment that changed, because Vercel env var updates apply only to new deployments.
4. If using ISR/cache later, ensure leaderboard API responses are not statically cached across day boundaries.

## Neon Setup

1. Verify schema assumptions:
   - `reaction_scores.created_at` is `TIMESTAMPTZ`
   - table and columns match `db/schema.sql`
2. Run migration:

```sql
CREATE INDEX IF NOT EXISTS reaction_scores_daily_leaderboard_idx
  ON reaction_scores (created_at, reaction_time_ms ASC, id ASC);

DROP INDEX IF EXISTS reaction_scores_ranking_idx;
```

3. If using Neon + Vercel integration:
   - `DATABASE_URL`/`POSTGRES_URL` can be auto-injected by integration.
   - Confirm Production uses the production branch/database.
   - Confirm Preview deployments use intended branch-specific DB behavior.

## Project Structure

- `app/page.tsx` — game container and client-side state machine
- `components/` — game panel, result card, leaderboard sections
- `app/api/scores/route.ts` — leaderboard API handlers
- `lib/db.ts` — leaderboard query + insert helpers
- `lib/timezone.ts` — app timezone resolution
- `db/schema.sql` — SQL schema for leaderboard table
- `db/migrations/` — migration scripts

## Notes on Robustness

- Timers are cleared on restart and unmount to prevent stale callbacks.
- Round IDs guard against delayed timer callbacks mutating new rounds.
- Input typing for name field is isolated; no keyboard shortcuts are used.
- Early click detection cleanly transitions to “Too soon” state.
