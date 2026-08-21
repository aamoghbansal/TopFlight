import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { generateOpponentPool, simulateMatch, type SimTeamStrength } from "./simulation-service";
import { finalizeDraftTeam } from "./draft-service";
import type { Difficulty } from "@/lib/config/tuning";

export async function runSeason(draftId: number) {
  const [draft] = await db.select().from(schema.drafts).where(eq(schema.drafts.id, draftId));
  if (!draft) throw new Error("Draft not found");

  let [team] = await db.select().from(schema.teams).where(eq(schema.teams.draftId, draftId));
  if (!team) {
    const finalized = await finalizeDraftTeam(draftId);
    team = finalized.team;
  }

  const [league] = await db.select().from(schema.leagues).where(eq(schema.leagues.id, draft.leagueId));
  if (!league) throw new Error("League not found");

  const matchesPerClub = (league.numClubs - 1) * 2;
  const opponents = generateOpponentPool(league.numClubs);

  const strength: SimTeamStrength = {
    overall: team.overall ?? 70,
    attack: team.attack ?? 70,
    midfield: team.midfield ?? 70,
    defence: team.defence ?? 70,
    goalkeeping: team.goalkeeping ?? 70,
    chemistry: team.chemistry ?? 70,
    positionalFit: team.positionalFit ?? 70,
    balance: team.balance ?? 70,
  };

  let wins = 0,
    draws = 0,
    losses = 0,
    goalsFor = 0,
    goalsAgainst = 0,
    cleanSheets = 0;
  let unbeatenStreak = 0,
    longestUnbeaten = 0,
    winStreak = 0,
    longestWin = 0;

  const matchdayResults: {
    matchday: number;
    isHome: boolean;
    opponentIndex: number;
    opponentName: string;
    result: ReturnType<typeof simulateMatch>;
  }[] = [];

  const opponentNames = [
    "Arsenal", "Aston Villa", "Chelsea", "Everton", "Liverpool",
    "Manchester City", "Manchester United", "Newcastle United", "Tottenham Hotspur", "West Ham United",
    "Brighton", "Crystal Palace", "Fulham", "Wolves", "Brentford",
    "Bournemouth", "Nottingham Forest", "Leicester City", "Southampton", "Leeds United"
  ];

  for (let md = 1; md <= matchesPerClub; md++) {
    const opponentIndex = (md - 1) % opponents.length;
    const opponent = opponents[opponentIndex];
    const isHome = md % 2 === 1;

    const seed = draft.seed ? hashStringToInt(`${draft.seed}-${md}`) : undefined;
    const result = simulateMatch(strength, opponent, isHome, draft.difficulty as Difficulty, seed);
    const oppName = opponentNames[opponentIndex % opponentNames.length];
    matchdayResults.push({ matchday: md, isHome, opponentIndex, opponentName: oppName, result });

    goalsFor += result.userGoals;
    goalsAgainst += result.opponentGoals;
    if (result.opponentGoals === 0) cleanSheets++;

    if (result.userGoals > result.opponentGoals) {
      wins++;
      unbeatenStreak++;
      winStreak++;
    } else if (result.userGoals === result.opponentGoals) {
      draws++;
      unbeatenStreak++;
      winStreak = 0;
    } else {
      losses++;
      unbeatenStreak = 0;
      winStreak = 0;
    }
    longestUnbeaten = Math.max(longestUnbeaten, unbeatenStreak);
    longestWin = Math.max(longestWin, winStreak);
  }

  const points = wins * league.pointsForWin + draws * league.pointsForDraw;
  const isPerfectSeason = wins === matchesPerClub;
  const isInvincible = losses === 0;

  // Rough final-position estimate: rank the user's points against a
  // synthetic points distribution for the rest of the (weighted) league.
  const estimatedRank = estimateFinalPosition(points, league.numClubs, matchesPerClub, league.pointsForWin);
  const gameScore = computeGameScore(points, matchesPerClub, league.pointsForWin, isPerfectSeason, isInvincible);

  // Clean up any existing season_results for this draft/team to prevent duplicate key errors
  const existingResults = await db.select().from(schema.seasonResults).where(eq(schema.seasonResults.draftId, draftId));
  if (existingResults.length > 0) {
    for (const er of existingResults) {
      await db.delete(schema.seasonResults).where(eq(schema.seasonResults.id, er.id));
    }
  }

  // Get drafted squad details
  const teamPlayersRows = await db
    .select({
      playerSeason: schema.playerSeasons,
      player: schema.players,
      slot: schema.formationSlots,
    })
    .from(schema.teamPlayers)
    .innerJoin(schema.playerSeasons, eq(schema.teamPlayers.playerSeasonId, schema.playerSeasons.id))
    .innerJoin(schema.players, eq(schema.playerSeasons.playerId, schema.players.id))
    .innerJoin(schema.formationSlots, eq(schema.teamPlayers.formationSlotId, schema.formationSlots.id))
    .where(eq(schema.teamPlayers.teamId, team.id));

  const sortedByGoals = [...teamPlayersRows].sort((a, b) => (b.playerSeason.goals ?? 0) - (a.playerSeason.goals ?? 0));
  const sortedByAssists = [...teamPlayersRows].sort((a, b) => (b.playerSeason.assists ?? 0) - (a.playerSeason.assists ?? 0));
  const sortedByOverall = [...teamPlayersRows].sort((a, b) => (b.playerSeason.overall ?? 0) - (a.playerSeason.overall ?? 0));

  const topScorerId = sortedByGoals[0]?.playerSeason.id ?? null;
  const topAssisterId = sortedByAssists[0]?.playerSeason.id ?? null;
  const bestPlayerId = sortedByOverall[0]?.playerSeason.id ?? null;

  const [seasonResult] = await db
    .insert(schema.seasonResults)
    .values({
      teamId: team.id,
      userId: draft.userId ? Number(draft.userId) : null,
      draftId,
      played: matchesPerClub,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      points,
      finalPosition: estimatedRank,
      topScorerPlayerSeasonId: topScorerId,
      topAssisterPlayerSeasonId: topAssisterId,
      bestPlayerSeasonId: bestPlayerId,
      longestUnbeatenStreak: longestUnbeaten,
      longestWinStreak: longestWin,
      cleanSheets,
      gameScore,
      isPerfectSeason,
      isInvincible,
    })
    .returning();

  return {
    seasonResult: {
      ...seasonResult,
      isPerfectSeason: Boolean(seasonResult.isPerfectSeason),
      isInvincible: Boolean(seasonResult.isInvincible),
    },
    matchdayResults,
    matchesPerClub,
    team,
    teamPlayers: teamPlayersRows.map((tp) => ({
      ...tp.playerSeason,
      fullName: tp.player.fullName,
      nationality: tp.player.nationality,
      slotRole: tp.slot.primaryRole,
    })),
    league,
  };
}

function hashStringToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

function estimateFinalPosition(
  userPoints: number,
  numClubs: number,
  matchesPerClub: number,
  pointsForWin: number
): number {
  // Synthetic reference curve for "typical" points totals across a table of this size.
  const maxPoints = matchesPerClub * pointsForWin;
  const topPoints = maxPoints * 0.72;
  const bottomPoints = maxPoints * 0.22;
  let rank = 1;
  for (let pos = 1; pos <= numClubs; pos++) {
    const frac = (pos - 1) / (numClubs - 1);
    const refPoints = topPoints - frac * (topPoints - bottomPoints);
    if (userPoints < refPoints) rank = pos + 1;
  }
  return Math.max(1, Math.min(numClubs, rank));
}

function computeGameScore(
  points: number,
  matchesPerClub: number,
  pointsForWin: number,
  perfect: boolean,
  invincible: boolean
): string {
  if (perfect) return "S+";
  const maxPoints = matchesPerClub * pointsForWin;
  const pct = points / maxPoints;
  if (invincible || pct >= 0.85) return "S";
  if (pct >= 0.75) return "A+";
  if (pct >= 0.65) return "A";
  if (pct >= 0.5) return "B";
  if (pct >= 0.35) return "C";
  return "D";
}
