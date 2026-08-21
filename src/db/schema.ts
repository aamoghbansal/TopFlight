import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  USERS                                                              */
/* ------------------------------------------------------------------ */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  isGuest: integer("is_guest", { mode: "boolean" }).notNull().default(false),
  favoriteLeagueId: integer("favorite_league_id"),
  favoriteFormationId: integer("favorite_formation_id"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

/* ------------------------------------------------------------------ */
/*  LEAGUES / CLUBS / SEASONS (data-driven per section 2)              */
/* ------------------------------------------------------------------ */

export const leagues = sqliteTable("leagues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. "PL", "LALIGA", "SERIEA"
  country: text("country").notNull(),
  name: text("name").notNull(),
  numClubs: integer("num_clubs").notNull(), // 18 or 20
  matchesPerClub: integer("matches_per_club").notNull(), // derived: (numClubs-1)*2
  seasonStart: integer("season_start").notNull(), // e.g. 1992
  seasonEnd: integer("season_end").notNull(), // e.g. 2026
  pointsForWin: integer("points_for_win").notNull().default(3),
  pointsForDraw: integer("points_for_draw").notNull().default(1),
});

export const clubs = sqliteTable("clubs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leagueId: integer("league_id").notNull().references(() => leagues.id),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  city: text("city"),
  colorPrimary: text("color_primary"), // for the original UI theme, not a copy of any real crest
});

export const clubSeasons = sqliteTable(
  "club_seasons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clubId: integer("club_id").notNull().references(() => clubs.id),
    leagueId: integer("league_id").notNull().references(() => leagues.id),
    seasonLabel: text("season_label").notNull(), // "2003/04"
    seasonStartYear: integer("season_start_year").notNull(), // 2003
    decade: text("decade").notNull(), // "2000s"
    finalPosition: integer("final_position"),
    notes: text("notes"), // e.g. "Invincibles"
  },
  (t) => ({
    uniqClubSeason: uniqueIndex("uniq_club_season").on(t.clubId, t.seasonStartYear),
    idxLeagueDecade: index("idx_clubseason_league_decade").on(t.leagueId, t.decade),
  })
);

/* ------------------------------------------------------------------ */
/*  PLAYERS / PLAYER-SEASONS (section 7 — the core draftable entity)   */
/* ------------------------------------------------------------------ */

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fullName: text("full_name").notNull(),
  nationality: text("nationality"),
  birthYear: integer("birth_year"),
});

export const playerSeasons = sqliteTable(
  "player_seasons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerId: integer("player_id").notNull().references(() => players.id),
    clubSeasonId: integer("club_season_id").notNull().references(() => clubSeasons.id),
    leagueId: integer("league_id").notNull().references(() => leagues.id),

    primaryPosition: text("primary_position").notNull(), // GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST, CF
    secondaryPositions: text("secondary_positions"), // JSON string array
    age: integer("age"),

    overall: integer("overall").notNull(),
    pace: integer("pace"),
    shooting: integer("shooting"),
    passing: integer("passing"),
    dribbling: integer("dribbling"),
    defending: integer("defending"),
    physical: integer("physical"),

    // Goalkeeper-specific (section 7)
    diving: integer("diving"),
    handling: integer("handling"),
    reflexes: integer("reflexes"),
    gkPositioning: integer("gk_positioning"),
    distribution: integer("distribution"),
    cleanSheets: integer("clean_sheets"),
    goalsConceded: integer("goals_conceded"),

    goals: integer("goals").default(0),
    assists: integer("assists").default(0),
    appearances: integer("appearances").default(0),

    performanceTier: text("performance_tier").notNull(), // S/A/B/C/D — game metadata, not an official rating
    historicalImportance: integer("historical_importance").default(0), // 0-100 flavor score
    tacticalTags: text("tactical_tags"), // JSON string array e.g. ["poacher","aerial-threat"]
    achievements: text("achievements"), // JSON string array, real honours (labelled as historical fact)
  },
  (t) => ({
    idxLeaguePos: index("idx_ps_league_pos").on(t.leagueId, t.primaryPosition),
    idxClubSeason: index("idx_ps_clubseason").on(t.clubSeasonId),
  })
);

/* ------------------------------------------------------------------ */
/*  FORMATIONS (section 5 — data-driven, not hard-coded logic)         */
/* ------------------------------------------------------------------ */

export const formations = sqliteTable("formations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // "4-3-3"
  label: text("label").notNull(),
});

export const formationSlots = sqliteTable(
  "formation_slots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    formationId: integer("formation_id").notNull().references(() => formations.id),
    slotOrder: integer("slot_order").notNull(), // draft round number within this formation
    primaryRole: text("primary_role").notNull(), // GK, LB, CB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST
    eligibleSecondaryRoles: text("eligible_secondary_roles"), // JSON string array
    positionalFitWeight: real("positional_fit_weight").notNull().default(1.0),
    tacticalImportance: real("tactical_importance").notNull().default(1.0),
  },
  (t) => ({
    idxFormationOrder: index("idx_slot_formation_order").on(t.formationId, t.slotOrder),
  })
);

/* ------------------------------------------------------------------ */
/*  DRAFTS                                                             */
/* ------------------------------------------------------------------ */

export const drafts = sqliteTable("drafts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id), // nullable: guest play allowed
  leagueId: integer("league_id").notNull().references(() => leagues.id),
  formationId: integer("formation_id").notNull().references(() => formations.id),

  mode: text("mode").notNull(), // classic | squad_first | position_first
  difficulty: text("difficulty").notNull(), // easy | normal | hard
  ratingVisibility: text("rating_visibility").notNull(), // visible | blind
  ratingModel: text("rating_model").notNull(), // career_season | prime
  era: text("era").notNull(), // all_time | 1990s | ... | modern
  seasonReveal: text("season_reveal").notNull(), // live | instant

  seed: text("seed"), // set for daily-challenge determinism
  isDailyChallenge: integer("is_daily_challenge", { mode: "boolean" }).default(false),

  status: text("status").notNull().default("in_progress"), // in_progress | complete | abandoned
  rerollsClubRemaining: integer("rerolls_club_remaining").notNull(),
  rerollsEraRemaining: integer("rerolls_era_remaining").notNull(),
  rerollsFullRemaining: integer("rerolls_full_remaining").notNull(),

  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
});

export const draftRounds = sqliteTable(
  "draft_rounds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    draftId: integer("draft_id").notNull().references(() => drafts.id),
    roundNumber: integer("round_number").notNull(),
    formationSlotId: integer("formation_slot_id").notNull().references(() => formationSlots.id),
    clubSeasonId: integer("club_season_id").references(() => clubSeasons.id), // the spun club-season
    status: text("status").notNull().default("pending"), // pending | resolved
  },
  (t) => ({
    idxDraftRound: uniqueIndex("uniq_draft_round").on(t.draftId, t.roundNumber),
  })
);

export const draftSelections = sqliteTable("draft_selections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  draftRoundId: integer("draft_round_id").notNull().references(() => draftRounds.id).unique(),
  playerSeasonId: integer("player_season_id").notNull().references(() => playerSeasons.id),
  formationSlotId: integer("formation_slot_id").notNull().references(() => formationSlots.id),
  positionalFitScore: real("positional_fit_score"),
  selectedAt: text("selected_at").default(sql`CURRENT_TIMESTAMP`),
});

/* ------------------------------------------------------------------ */
/*  TEAM (the resolved XI once a draft completes)                      */
/* ------------------------------------------------------------------ */

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  draftId: integer("draft_id").notNull().references(() => drafts.id).unique(),
  overall: real("overall"),
  attack: real("attack"),
  midfield: real("midfield"),
  defence: real("defence"),
  goalkeeping: real("goalkeeping"),
  physical: real("physical"),
  chemistry: real("chemistry"),
  positionalFit: real("positional_fit"),
  balance: real("balance"),
  tacticalFit: real("tactical_fit"),
  tacticalIdentity: text("tactical_identity"), // possession | counter | high_press | direct | balanced
  ratingBreakdown: text("rating_breakdown"), // JSON explanation, section 14
  chemistryBreakdown: text("chemistry_breakdown"), // JSON explanation, section 15
});

export const teamPlayers = sqliteTable("team_players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id").notNull().references(() => teams.id),
  playerSeasonId: integer("player_season_id").notNull().references(() => playerSeasons.id),
  formationSlotId: integer("formation_slot_id").notNull().references(() => formationSlots.id),
});

/* ------------------------------------------------------------------ */
/*  OPPONENTS / FIXTURES / MATCHES                                     */
/* ------------------------------------------------------------------ */

export const opponents = sqliteTable("opponents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leagueId: integer("league_id").notNull().references(() => leagues.id),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  strengthTier: text("strength_tier").notNull(), // title_contender | european | mid_table | relegation_battler
  overall: real("overall").notNull(),
  attack: real("attack").notNull(),
  midfield: real("midfield").notNull(),
  defence: real("defence").notNull(),
  goalkeeper: real("goalkeeper").notNull(),
  tacticalStyle: text("tactical_style").notNull(),
  homeAdvantageModifier: real("home_advantage_modifier").notNull().default(1.0),
});

export const fixtures = sqliteTable(
  "fixtures",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teamId: integer("team_id").notNull().references(() => teams.id),
    matchday: integer("matchday").notNull(),
    opponentId: integer("opponent_id").notNull().references(() => opponents.id),
    isHome: integer("is_home", { mode: "boolean" }).notNull(),
  },
  (t) => ({
    idxTeamMatchday: uniqueIndex("uniq_team_matchday").on(t.teamId, t.matchday),
  })
);

export const matches = sqliteTable("matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fixtureId: integer("fixture_id").notNull().references(() => fixtures.id).unique(),
  userGoals: integer("user_goals").notNull(),
  opponentGoals: integer("opponent_goals").notNull(),
  possession: real("possession"),
  shots: integer("shots"),
  shotsOnTarget: integer("shots_on_target"),
  matchRating: real("match_rating"),
  simulatedAt: text("simulated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const matchEvents = sqliteTable("match_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchId: integer("match_id").notNull().references(() => matches.id),
  minute: integer("minute").notNull(),
  eventType: text("event_type").notNull(), // goal | assist | card | sub
  side: text("side").notNull(), // user | opponent
  playerSeasonId: integer("player_season_id").references(() => playerSeasons.id),
  relatedPlayerSeasonId: integer("related_player_season_id").references(() => playerSeasons.id), // e.g. assist provider
});

export const playerMatchStats = sqliteTable("player_match_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchId: integer("match_id").notNull().references(() => matches.id),
  playerSeasonId: integer("player_season_id").notNull().references(() => playerSeasons.id),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  rating: real("rating"),
  wasMotm: integer("was_motm", { mode: "boolean" }).default(false),
});

/* ------------------------------------------------------------------ */
/*  SEASON RESULTS / ACHIEVEMENTS / LEADERBOARDS / DAILY CHALLENGE     */
/* ------------------------------------------------------------------ */

export const seasonResults = sqliteTable("season_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id").notNull().references(() => teams.id).unique(),
  userId: integer("user_id").references(() => users.id),
  draftId: integer("draft_id").notNull().references(() => drafts.id),

  played: integer("played").notNull(),
  wins: integer("wins").notNull(),
  draws: integer("draws").notNull(),
  losses: integer("losses").notNull(),
  goalsFor: integer("goals_for").notNull(),
  goalsAgainst: integer("goals_against").notNull(),
  points: integer("points").notNull(),
  finalPosition: integer("final_position"),

  topScorerPlayerSeasonId: integer("top_scorer_player_season_id").references(() => playerSeasons.id),
  topAssisterPlayerSeasonId: integer("top_assister_player_season_id").references(() => playerSeasons.id),
  bestPlayerSeasonId: integer("best_player_season_id").references(() => playerSeasons.id),

  longestUnbeatenStreak: integer("longest_unbeaten_streak"),
  longestWinStreak: integer("longest_win_streak"),
  cleanSheets: integer("clean_sheets"),

  gameScore: text("game_score"), // S+, S, A+, A, B, C, D
  isPerfectSeason: integer("is_perfect_season", { mode: "boolean" }).default(false),
  isInvincible: integer("is_invincible", { mode: "boolean" }).default(false),

  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // PERFECT_SEASON, INVINCIBLE, CHAMPIONS, ...
  label: text("label").notNull(),
  description: text("description").notNull(),
});

export const userAchievements = sqliteTable(
  "user_achievements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    achievementId: integer("achievement_id").notNull().references(() => achievements.id),
    seasonResultId: integer("season_result_id").references(() => seasonResults.id),
    earnedAt: text("earned_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    uniqUserAchievement: uniqueIndex("uniq_user_achievement").on(t.userId, t.achievementId, t.seasonResultId),
  })
);

export const dailyChallenges = sqliteTable("daily_challenges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(), // "2026-08-20"
  seed: text("seed").notNull(),
  leagueId: integer("league_id").notNull().references(() => leagues.id),
  formationId: integer("formation_id").notNull().references(() => formations.id),
  difficulty: text("difficulty").notNull(),
});

export const leaderboardEntries = sqliteTable(
  "leaderboard_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    seasonResultId: integer("season_result_id").notNull().references(() => seasonResults.id),
    leagueId: integer("league_id").notNull().references(() => leagues.id),
    formationId: integer("formation_id").notNull().references(() => formations.id),
    difficulty: text("difficulty").notNull(),
    ratingVisibility: text("rating_visibility").notNull(),
    isDailyChallenge: integer("is_daily_challenge", { mode: "boolean" }).default(false),
    dailyChallengeDate: text("daily_challenge_date"),
    score: integer("score").notNull(), // sortable numeric score
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    idxLeaderboardSort: index("idx_leaderboard_sort").on(t.leagueId, t.formationId, t.difficulty, t.score),
  })
);
