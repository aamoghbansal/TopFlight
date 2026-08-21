# TopFlight XI

Draft an all-time XI from real historical club-seasons across Europe's top
five leagues, then simulate a season and chase a perfect record. Inspired
by the gameplay concept of historical football draft simulators like
38-0, built as an original product: own name, own visual language, own
codebase.

## What's here right now

This is **Phase 1-9 in progress**, not the full 46-section spec — see
"Current status" below for exactly what's implemented vs. stubbed. The
core gameplay loop (pick settings → draft an XI from real historical
squads → simulate a season → see your result) is fully working end to
end for the Premier League.

## How the game works

1. Pick a league, formation, and settings (difficulty, rating visibility,
   rating model, era, reveal style).
2. The draft engine spins a real historical club-season (e.g. "Arsenal
   2003/04") for your next open formation slot.
3. You see that club-season's real squad and pick one player eligible for
   the slot.
4. Repeat until your XI is full.
5. Your XI's Attack/Midfield/Defence/Goalkeeping/Chemistry/Balance ratings
   are calculated and explained.
6. A full season is simulated match by match against a generated set of
   opponents, and you get a final result: record, points, final position,
   game score (S+ down to D), and achievements like PERFECT SEASON or
   INVINCIBLE.

## League formats

Match counts are never hard-coded — they're derived from club count:
`(numClubs - 1) * 2`. Premier League / La Liga / Serie A run 20 clubs / 38
games; Bundesliga / Ligue 1 run 18 clubs / 34 games. See
`src/lib/config/leagues.ts`.

## Formation system

Formations are pure data (`src/lib/config/formations.ts`), each with an
ordered list of slots, a primary role, and auto-derived eligible secondary
roles. Adding a new formation means adding a config entry, not touching
game logic.

## Rating, chemistry, and simulation

- `src/lib/services/rating-service.ts` — centralized team rating and
  chemistry calculation, with an explanation breakdown (never duplicated
  elsewhere).
- `src/lib/services/simulation-service.ts` — match simulation using an
  expected-goals model with controlled randomness (Poisson-style goal
  sampling), not "higher rating always wins." Supports deterministic
  seeding for daily challenges.
- `src/lib/services/season-service.ts` — runs a full season of matches,
  tracks streaks/clean sheets, computes a final game score.
- `src/lib/config/tuning.ts` — every balancing constant (chemistry weight,
  home advantage, randomness range, etc.) lives here, per the "game
  balancing" section of the design spec. Tune here, not scattered through
  the codebase.

## Data model

`src/db/schema.ts` implements the full entity list from the design spec:
User, League, Club, ClubSeason, Player, PlayerSeason, Formation,
FormationSlot, Draft, DraftRound, DraftSelection, Team, TeamPlayer,
Opponent, Fixture, Match, MatchEvent, PlayerMatchStat, SeasonResult,
Achievement, UserAchievement, DailyChallenge, LeaderboardEntry.

## Current status (honest accounting)

**Working end to end:**
- Data model for the full entity list above.
- League config for all five target leagues (data-driven match counts).
- Formation config for all seven required formations.
- Draft engine: spin, reroll (club/era/full, difficulty-gated), select,
  full server-side validation (no duplicate players, no off-squad picks,
  no picks after completion).
- Rating + chemistry service with an explanation breakdown.
- Match simulation engine (expected goals, controlled randomness, home
  advantage, difficulty multiplier).
- Season service: full season run, streaks, clean sheets, game score,
  PERFECT SEASON / INVINCIBLE detection.
- A playable UI: settings screen -> draft screen (spin/reroll/select,
  progress tracker, filled-slot recap) -> result screen.
- Five real, fully-squaded Premier League club-seasons as demo data
  (Arsenal 03/04, Man Utd 98/99, Liverpool 19/20, Man City 17/18, Chelsea
  04/05) — real players, real honours, game's own OVR/tier ratings
  clearly labeled as such.

**Stubbed or not yet built** (this is a lot of scope — see the original
spec's 46 sections and 12 phases):
- La Liga / Serie A / Bundesliga / Ligue 1 have league config but **no
  club-season/player data yet** — the import pipeline (`data/*.json` +
  seed script) is the intended path; `scripts/seed.ts` shows the pattern
  to extend.
- Only 5 club-seasons seeded total, vs. the spec's "18,000+ player
  seasons." Same import-pipeline story.
- No user accounts / auth UI yet (schema + password-hashing/JWT utility
  exist in `src/lib/auth.ts`, but no register/login routes or pages).
- No leaderboards, daily challenge, sharing, or achievement-awarding flow
  (schema exists; award-on-season-complete logic doesn't yet).
- Opponent engine uses the spec's own suggested MVP shortcut (section
  19, option B): synthetic opponent strength tiers rather than full
  historical squads for all opposing clubs.
- Live match-by-match reveal, match events/goalscorers, and per-player
  match stats aren't generated yet — only aggregate match results.
- Visual design is a functional dark theme, not the "premium, polished
  consumer game" bar the spec asks for — that's the section 31 phase.
- No automated test suite yet (section 40).
- Balancing is a first pass, not tuned against the batch-simulation
  harness section 41 asks for — early runs lean draw-heavy and should be
  retuned in `src/lib/config/tuning.ts`.

## Setup

```bash
npm install
npm run seed      # creates topflight.db and loads leagues/formations/demo squads
npm run dev       # http://localhost:3000
```

## Environment variables

- `DATABASE_PATH` — path to the SQLite file (default `./topflight.db`).
- `AUTH_SECRET` — JWT signing secret (only used once auth routes are
  wired up).

## Database

SQLite via `better-sqlite3` + Drizzle ORM. `scripts/seed.ts` currently
runs its own inline `CREATE TABLE IF NOT EXISTS` DDL so the project works
without a migration step during early development — once the schema
stabilizes, switch to `drizzle-kit generate` + `drizzle-kit migrate`
(config already in `drizzle.config.ts`). Swapping to Postgres for
production later is a connection-string change plus swapping the
`better-sqlite3` driver for `pg` in `src/db/client.ts`.

## Development commands

- `npm run dev` — start the app
- `npm run seed` — (re)seed the database
- `npm run build` — production build
- `npm run lint` — lint

## Deploying later

Because this is a single Next.js app, the straightforward path is
Vercel (or any Node host): push the repo, set `DATABASE_PATH` (or switch
to a hosted Postgres and update `src/db/client.ts`), set `AUTH_SECRET`,
deploy.
