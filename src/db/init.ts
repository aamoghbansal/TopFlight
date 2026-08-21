import { sqlite as client } from "./client";
import { LEAGUES, matchesPerClub } from "../lib/config/leagues";
import { FORMATIONS } from "../lib/config/formations";
import { PREMIER_LEAGUE_SEED } from "../lib/data/premier-league-seed";

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureDatabaseInitialized() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await ensureSchema();
      await seedInitialData();
      initialized = true;
    } catch (e) {
      console.error("Database initialization error:", e);
    }
  })();

  return initPromise;
}

export async function ensureSchema() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      hashed_password TEXT NOT NULL,
      is_guest INTEGER NOT NULL DEFAULT 0,
      favorite_league_id INTEGER,
      favorite_formation_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS leagues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      country TEXT NOT NULL,
      name TEXT NOT NULL,
      num_clubs INTEGER NOT NULL,
      matches_per_club INTEGER NOT NULL,
      season_start INTEGER NOT NULL,
      season_end INTEGER NOT NULL,
      points_for_win INTEGER NOT NULL DEFAULT 3,
      points_for_draw INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      league_id INTEGER NOT NULL REFERENCES leagues(id),
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      city TEXT,
      color_primary TEXT
    );
    CREATE TABLE IF NOT EXISTS club_seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL REFERENCES clubs(id),
      league_id INTEGER NOT NULL REFERENCES leagues(id),
      season_label TEXT NOT NULL,
      season_start_year INTEGER NOT NULL,
      decade TEXT NOT NULL,
      final_position INTEGER,
      notes TEXT,
      UNIQUE(club_id, season_start_year)
    );
    CREATE INDEX IF NOT EXISTS idx_clubseason_league_decade ON club_seasons(league_id, decade);
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      nationality TEXT,
      birth_year INTEGER
    );
    CREATE TABLE IF NOT EXISTS player_seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id),
      club_season_id INTEGER NOT NULL REFERENCES club_seasons(id),
      league_id INTEGER NOT NULL REFERENCES leagues(id),
      primary_position TEXT NOT NULL,
      secondary_positions TEXT,
      age INTEGER,
      overall INTEGER NOT NULL,
      pace INTEGER, shooting INTEGER, passing INTEGER, dribbling INTEGER, defending INTEGER, physical INTEGER,
      diving INTEGER, handling INTEGER, reflexes INTEGER, gk_positioning INTEGER, distribution INTEGER,
      clean_sheets INTEGER, goals_conceded INTEGER,
      goals INTEGER DEFAULT 0, assists INTEGER DEFAULT 0, appearances INTEGER DEFAULT 0,
      performance_tier TEXT NOT NULL,
      historical_importance INTEGER DEFAULT 0,
      tactical_tags TEXT,
      achievements TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_ps_league_pos ON player_seasons(league_id, primary_position);
    CREATE INDEX IF NOT EXISTS idx_ps_clubseason ON player_seasons(club_season_id);
    CREATE TABLE IF NOT EXISTS formations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS formation_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formation_id INTEGER NOT NULL REFERENCES formations(id),
      slot_order INTEGER NOT NULL,
      primary_role TEXT NOT NULL,
      eligible_secondary_roles TEXT,
      positional_fit_weight REAL NOT NULL DEFAULT 1.0,
      tactical_importance REAL NOT NULL DEFAULT 1.0
    );
    CREATE INDEX IF NOT EXISTS idx_slot_formation_order ON formation_slots(formation_id, slot_order);
    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      league_id INTEGER NOT NULL REFERENCES leagues(id),
      formation_id INTEGER NOT NULL REFERENCES formations(id),
      mode TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      rating_visibility TEXT NOT NULL,
      rating_model TEXT NOT NULL,
      era TEXT NOT NULL,
      season_reveal TEXT NOT NULL,
      seed TEXT,
      is_daily_challenge INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'in_progress',
      rerolls_club_remaining INTEGER NOT NULL,
      rerolls_era_remaining INTEGER NOT NULL,
      rerolls_full_remaining INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS draft_rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draft_id INTEGER NOT NULL REFERENCES drafts(id),
      round_number INTEGER NOT NULL,
      formation_slot_id INTEGER NOT NULL REFERENCES formation_slots(id),
      club_season_id INTEGER REFERENCES club_seasons(id),
      status TEXT NOT NULL DEFAULT 'pending',
      UNIQUE(draft_id, round_number)
    );
    CREATE TABLE IF NOT EXISTS draft_selections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draft_round_id INTEGER NOT NULL UNIQUE REFERENCES draft_rounds(id),
      player_season_id INTEGER NOT NULL REFERENCES player_seasons(id),
      formation_slot_id INTEGER NOT NULL REFERENCES formation_slots(id),
      positional_fit_score REAL,
      selected_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draft_id INTEGER NOT NULL UNIQUE REFERENCES drafts(id),
      overall REAL, attack REAL, midfield REAL, defence REAL, goalkeeping REAL, physical REAL,
      chemistry REAL, positional_fit REAL, balance REAL, tactical_fit REAL,
      tactical_identity TEXT, rating_breakdown TEXT, chemistry_breakdown TEXT
    );
    CREATE TABLE IF NOT EXISTS team_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      player_season_id INTEGER NOT NULL REFERENCES player_seasons(id),
      formation_slot_id INTEGER NOT NULL REFERENCES formation_slots(id)
    );
    CREATE TABLE IF NOT EXISTS opponents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      league_id INTEGER NOT NULL REFERENCES leagues(id),
      club_id INTEGER NOT NULL REFERENCES clubs(id),
      strength_tier TEXT NOT NULL,
      overall REAL NOT NULL, attack REAL NOT NULL, midfield REAL NOT NULL, defence REAL NOT NULL, goalkeeper REAL NOT NULL,
      tactical_style TEXT NOT NULL,
      home_advantage_modifier REAL NOT NULL DEFAULT 1.0
    );
    CREATE TABLE IF NOT EXISTS fixtures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      matchday INTEGER NOT NULL,
      opponent_id INTEGER NOT NULL REFERENCES opponents(id),
      is_home INTEGER NOT NULL,
      UNIQUE(team_id, matchday)
    );
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fixture_id INTEGER NOT NULL UNIQUE REFERENCES fixtures(id),
      user_goals INTEGER NOT NULL,
      opponent_goals INTEGER NOT NULL,
      possession REAL, shots INTEGER, shots_on_target INTEGER, match_rating REAL,
      simulated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS match_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL REFERENCES matches(id),
      minute INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      side TEXT NOT NULL,
      player_season_id INTEGER REFERENCES player_seasons(id),
      related_player_season_id INTEGER REFERENCES player_seasons(id)
    );
    CREATE TABLE IF NOT EXISTS player_match_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL REFERENCES matches(id),
      player_season_id INTEGER NOT NULL REFERENCES player_seasons(id),
      goals INTEGER DEFAULT 0, assists INTEGER DEFAULT 0, rating REAL, was_motm INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS season_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL UNIQUE REFERENCES teams(id),
      user_id INTEGER REFERENCES users(id),
      draft_id INTEGER NOT NULL REFERENCES drafts(id),
      played INTEGER NOT NULL, wins INTEGER NOT NULL, draws INTEGER NOT NULL, losses INTEGER NOT NULL,
      goals_for INTEGER NOT NULL, goals_against INTEGER NOT NULL, points INTEGER NOT NULL, final_position INTEGER,
      top_scorer_player_season_id INTEGER REFERENCES player_seasons(id),
      top_assister_player_season_id INTEGER REFERENCES player_seasons(id),
      best_player_season_id INTEGER REFERENCES player_seasons(id),
      longest_unbeaten_streak INTEGER, longest_win_streak INTEGER, clean_sheets INTEGER,
      game_score TEXT, is_perfect_season INTEGER DEFAULT 0, is_invincible INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      description TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      achievement_id INTEGER NOT NULL REFERENCES achievements(id),
      season_result_id INTEGER REFERENCES season_results(id),
      earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id, season_result_id)
    );
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      seed TEXT NOT NULL,
      league_id INTEGER NOT NULL REFERENCES leagues(id),
      formation_id INTEGER NOT NULL REFERENCES formations(id),
      difficulty TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leaderboard_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      season_result_id INTEGER NOT NULL REFERENCES season_results(id),
      league_id INTEGER NOT NULL REFERENCES leagues(id),
      formation_id INTEGER NOT NULL REFERENCES formations(id),
      difficulty TEXT NOT NULL,
      rating_visibility TEXT NOT NULL,
      is_daily_challenge INTEGER DEFAULT 0,
      daily_challenge_date TEXT,
      score INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_leaderboard_sort ON leaderboard_entries(league_id, formation_id, difficulty, score);
  `);
}

export async function seedInitialData() {
  // Leagues
  for (const l of LEAGUES) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO leagues (code, country, name, num_clubs, matches_per_club, season_start, season_end, points_for_win, points_for_draw)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [l.code, l.country, l.name, l.numClubs, matchesPerClub(l.numClubs), l.seasonStart, l.seasonEnd, l.pointsForWin, l.pointsForDraw],
    });
  }

  // Formations
  for (const f of FORMATIONS) {
    await client.execute({ sql: `INSERT OR IGNORE INTO formations (code, label) VALUES (?, ?)`, args: [f.code, f.label] });
    const row = await client.execute({ sql: `SELECT id FROM formations WHERE code = ?`, args: [f.code] });
    const formationId = Number(row.rows[0].id);

    const existing = await client.execute({ sql: `SELECT COUNT(*) as c FROM formation_slots WHERE formation_id = ?`, args: [formationId] });
    if (Number(existing.rows[0].c) === 0) {
      for (const s of f.slots) {
        await client.execute({
          sql: `INSERT INTO formation_slots (formation_id, slot_order, primary_role, eligible_secondary_roles, positional_fit_weight, tactical_importance)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [formationId, s.slotOrder, s.primaryRole, JSON.stringify(s.eligibleSecondaryRoles), s.positionalFitWeight, s.tacticalImportance],
        });
      }
    }
  }

  // Premier League demo club-seasons + players
  const plRes = await client.execute(`SELECT id FROM leagues WHERE code = 'PL'`);
  if (plRes.rows.length > 0) {
    const plId = Number(plRes.rows[0].id);

    for (const cs of PREMIER_LEAGUE_SEED) {
      const clubRes = await client.execute({ sql: `SELECT id FROM clubs WHERE league_id = ? AND name = ?`, args: [plId, cs.clubName] });
      let clubId: number;
      if (clubRes.rows.length === 0) {
        const info = await client.execute({
          sql: `INSERT INTO clubs (league_id, name, short_name, color_primary) VALUES (?, ?, ?, ?)`,
          args: [plId, cs.clubName, cs.clubShort, cs.colorPrimary],
        });
        clubId = Number(info.lastInsertRowid);
      } else {
        clubId = Number(clubRes.rows[0].id);
      }

      const csRes = await client.execute({
        sql: `SELECT id FROM club_seasons WHERE club_id = ? AND season_start_year = ?`,
        args: [clubId, cs.seasonStartYear],
      });
      if (csRes.rows.length > 0) continue;

      const csInfo = await client.execute({
        sql: `INSERT INTO club_seasons (club_id, league_id, season_label, season_start_year, decade, final_position, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [clubId, plId, cs.seasonLabel, cs.seasonStartYear, cs.decade, cs.finalPosition, cs.notes],
      });
      const clubSeasonId = Number(csInfo.lastInsertRowid);

      for (const p of cs.players) {
        const playerRes = await client.execute({ sql: `SELECT id FROM players WHERE full_name = ?`, args: [p.fullName] });
        let playerId: number;
        if (playerRes.rows.length === 0) {
          const info = await client.execute({
            sql: `INSERT INTO players (full_name, nationality) VALUES (?, ?)`,
            args: [p.fullName, p.nationality],
          });
          playerId = Number(info.lastInsertRowid);
        } else {
          playerId = Number(playerRes.rows[0].id);
        }

        await client.execute({
          sql: `INSERT INTO player_seasons (
              player_id, club_season_id, league_id, primary_position, secondary_positions, age, overall,
              pace, shooting, passing, dribbling, defending, physical,
              diving, handling, reflexes, gk_positioning, distribution,
              goals, assists, appearances, performance_tier, tactical_tags, achievements
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            playerId,
            clubSeasonId,
            plId,
            p.primaryPosition,
            JSON.stringify(p.secondaryPositions),
            p.age,
            p.overall,
            p.pace ?? null,
            p.shooting ?? null,
            p.passing ?? null,
            p.dribbling ?? null,
            p.defending ?? null,
            p.physical ?? null,
            p.diving ?? null,
            p.handling ?? null,
            p.reflexes ?? null,
            p.gkPositioning ?? null,
            p.distribution ?? null,
            p.goals,
            p.assists,
            p.appearances,
            p.performanceTier,
            JSON.stringify(p.tacticalTags),
            JSON.stringify(p.achievements),
          ],
        });
      }
    }
  }

  // Achievements catalogue
  const achievements: [string, string, string][] = [
    ["PERFECT_SEASON", "Perfect Season", "Won every single match in the season."],
    ["INVINCIBLE", "Invincible", "Went the whole season unbeaten."],
    ["CHAMPIONS", "Champions", "Finished first in the league."],
    ["HUNDRED_POINT_CLUB", "100 Point Club", "Reached 100 points or more in a 38-game season."],
    ["GOLDEN_ATTACK", "Golden Attack", "Recorded an exceptional goals-for tally."],
  ];
  for (const [code, label, description] of achievements) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO achievements (code, label, description) VALUES (?, ?, ?)`,
      args: [code, label, description],
    });
  }
}
