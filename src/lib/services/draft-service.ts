import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { ensureDatabaseInitialized } from "@/db/init";
import { getFormation } from "@/lib/config/formations";
import { REROLL_ALLOWANCE, ERA_YEAR_RANGES, applyRatingModel, type Difficulty, type Era, type RatingModel } from "@/lib/config/tuning";
import { computePositionalFit, computeTeamRating, type RatedPlayer } from "./rating-service";

export interface CreateDraftInput {
  userId: number | null;
  leagueCode: string;
  formationCode: string;
  mode: "classic" | "squad_first" | "position_first";
  difficulty: Difficulty;
  ratingVisibility: "visible" | "blind";
  ratingModel: "career_season" | "prime";
  era: Era;
  seasonReveal: "live" | "instant";
  seed?: string;
}

export class DraftEngineError extends Error {}

export async function createDraft(input: CreateDraftInput) {
  await ensureDatabaseInitialized();
  const formationCfg = getFormation(input.formationCode);
  if (!formationCfg) throw new DraftEngineError(`Unknown formation ${input.formationCode}`);

  const [league] = await db.select().from(schema.leagues).where(eq(schema.leagues.code, input.leagueCode));
  if (!league) throw new DraftEngineError(`Unknown league ${input.leagueCode}`);

  const [formationRow] = await db.select().from(schema.formations).where(eq(schema.formations.code, input.formationCode));
  if (!formationRow) throw new DraftEngineError(`Formation ${input.formationCode} not seeded`);

  const rerolls = REROLL_ALLOWANCE[input.difficulty];

  const [draft] = await db
    .insert(schema.drafts)
    .values({
      userId: input.userId ?? undefined,
      leagueId: league.id,
      formationId: formationRow.id,
      mode: input.mode,
      difficulty: input.difficulty,
      ratingVisibility: input.ratingVisibility,
      ratingModel: input.ratingModel,
      era: input.era,
      seasonReveal: input.seasonReveal,
      seed: input.seed,
      isDailyChallenge: !!input.seed,
      rerollsClubRemaining: rerolls.club,
      rerollsEraRemaining: rerolls.era,
      rerollsFullRemaining: rerolls.full,
    })
    .returning();

  const slots = await db
    .select()
    .from(schema.formationSlots)
    .where(eq(schema.formationSlots.formationId, formationRow.id))
    .orderBy(schema.formationSlots.slotOrder);

  for (const slotRow of slots) {
    await db.insert(schema.draftRounds).values({
      draftId: draft.id,
      roundNumber: slotRow.slotOrder,
      formationSlotId: slotRow.id,
      status: "pending",
    });
  }

  return draft;
}

async function eligibleClubSeasonIds(leagueId: number, era: Era): Promise<number[]> {
  const range = ERA_YEAR_RANGES[era];
  const rows = await db.select().from(schema.clubSeasons).where(eq(schema.clubSeasons.leagueId, leagueId));
  const filtered = range
    ? rows.filter((r) => r.seasonStartYear >= range[0] && r.seasonStartYear <= range[1])
    : rows;
  return filtered.map((r) => r.id);
}

export async function spinForRound(draftId: number, roundNumber: number) {
  const [draft] = await db.select().from(schema.drafts).where(eq(schema.drafts.id, draftId));
  if (!draft) throw new DraftEngineError("Draft not found");
  if (draft.status !== "in_progress") throw new DraftEngineError("Draft is not in progress");

  const [round] = await db
    .select()
    .from(schema.draftRounds)
    .where(and(eq(schema.draftRounds.draftId, draftId), eq(schema.draftRounds.roundNumber, roundNumber)));
  if (!round) throw new DraftEngineError("Round not found");
  if (round.status !== "pending") throw new DraftEngineError("Round already resolved");

  // Note: the same club-season CAN be redrawn across rounds — a squad may
  // reasonably supply more than one drafted player over the course of a
  // run. Only individual player-seasons are prevented from being drafted
  // twice (enforced in selectPlayer).
  const candidateIds = await eligibleClubSeasonIds(draft.leagueId, draft.era as Era);
  if (candidateIds.length === 0) throw new DraftEngineError("No club-seasons available for this league/era");

  const chosenId = candidateIds[Math.floor(Math.random() * candidateIds.length)];

  await db.update(schema.draftRounds).set({ clubSeasonId: chosenId }).where(eq(schema.draftRounds.id, round.id));

  const [clubSeason] = await db.select().from(schema.clubSeasons).where(eq(schema.clubSeasons.id, chosenId));
  const [club] = await db.select().from(schema.clubs).where(eq(schema.clubs.id, clubSeason.clubId));
  const squadRows = await db
    .select({ playerSeason: schema.playerSeasons, player: schema.players })
    .from(schema.playerSeasons)
    .innerJoin(schema.players, eq(schema.playerSeasons.playerId, schema.players.id))
    .where(eq(schema.playerSeasons.clubSeasonId, chosenId));
  const squad = squadRows.map((r) => ({
    ...r.playerSeason,
    fullName: r.player.fullName,
    nationality: r.player.nationality,
    // Overridden with the rating-model-adjusted value so the UI always
    // just reads `overall` — "prime" reinterprets it as career-peak form.
    overall: applyRatingModel(r.playerSeason.overall, r.playerSeason.performanceTier, draft.ratingModel as RatingModel),
  }));

  const [slot] = await db.select().from(schema.formationSlots).where(eq(schema.formationSlots.id, round.formationSlotId));

  return { clubSeason, club, squad, slot, draft };
}

export type RerollType = "club" | "era" | "full";

export async function rerollRound(draftId: number, roundNumber: number, type: RerollType) {
  const [draft] = await db.select().from(schema.drafts).where(eq(schema.drafts.id, draftId));
  if (!draft) throw new DraftEngineError("Draft not found");

  const remainingField =
    type === "club" ? "rerollsClubRemaining" : type === "era" ? "rerollsEraRemaining" : "rerollsFullRemaining";
  const remaining = draft[remainingField] as number;
  if (remaining <= 0) throw new DraftEngineError(`No ${type} rerolls remaining`);

  await db
    .update(schema.drafts)
    .set({ [remainingField]: remaining - 1 })
    .where(eq(schema.drafts.id, draftId));

  // Clear the round's current club-season so it can be respun.
  const [round] = await db
    .select()
    .from(schema.draftRounds)
    .where(and(eq(schema.draftRounds.draftId, draftId), eq(schema.draftRounds.roundNumber, roundNumber)));
  if (round) {
    await db.update(schema.draftRounds).set({ clubSeasonId: null }).where(eq(schema.draftRounds.id, round.id));
  }

  return spinForRound(draftId, roundNumber);
}

export async function selectPlayer(
  draftId: number,
  roundNumber: number,
  playerSeasonId: number,
  targetSlotId?: number
) {
  const [draft] = await db.select().from(schema.drafts).where(eq(schema.drafts.id, draftId));
  if (!draft) throw new DraftEngineError("Draft not found");
  if (draft.status !== "in_progress") throw new DraftEngineError("Draft is not in progress");

  const [round] = await db
    .select()
    .from(schema.draftRounds)
    .where(and(eq(schema.draftRounds.draftId, draftId), eq(schema.draftRounds.roundNumber, roundNumber)));
  if (!round) throw new DraftEngineError("Round not found");
  if (round.status !== "pending") throw new DraftEngineError("Round already resolved");
  if (!round.clubSeasonId) throw new DraftEngineError("Spin for a club-season before selecting a player");

  const [playerSeason] = await db
    .select()
    .from(schema.playerSeasons)
    .where(eq(schema.playerSeasons.id, playerSeasonId));
  if (!playerSeason) throw new DraftEngineError("Player-season not found");
  if (playerSeason.clubSeasonId !== round.clubSeasonId)
    throw new DraftEngineError("That player is not part of the current club-season squad");

  // No duplicate players across the draft.
  const existingSelections = await db
    .select({
      playerSeasonId: schema.draftSelections.playerSeasonId,
      formationSlotId: schema.draftSelections.formationSlotId,
      roundId: schema.draftSelections.draftRoundId,
    })
    .from(schema.draftSelections)
    .innerJoin(schema.draftRounds, eq(schema.draftSelections.draftRoundId, schema.draftRounds.id))
    .where(eq(schema.draftRounds.draftId, draftId));

  if (existingSelections.some((s) => s.playerSeasonId === playerSeasonId)) {
    throw new DraftEngineError("That player-season has already been drafted in this run");
  }

  // Determine slot: either targetSlotId or round.formationSlotId
  const chosenSlotId = targetSlotId || round.formationSlotId;

  // Ensure the target slot is not already taken by a previously resolved round
  if (existingSelections.some((s) => s.formationSlotId === chosenSlotId)) {
    throw new DraftEngineError("That pitch position is already filled");
  }

  const [slot] = await db.select().from(schema.formationSlots).where(eq(schema.formationSlots.id, chosenSlotId));
  if (!slot) throw new DraftEngineError("Formation slot not found");

  const secondaries: string[] = playerSeason.secondaryPositions ? JSON.parse(playerSeason.secondaryPositions) : [];
  const fit = computePositionalFit(playerSeason.primaryPosition, secondaries, slot.primaryRole);

  // If chosenSlotId is different from round.formationSlotId, find any other pending round currently assigned to chosenSlotId and swap it to round.formationSlotId
  if (chosenSlotId !== round.formationSlotId) {
    const [otherPendingRound] = await db
      .select()
      .from(schema.draftRounds)
      .where(
        and(
          eq(schema.draftRounds.draftId, draftId),
          eq(schema.draftRounds.status, "pending"),
          eq(schema.draftRounds.formationSlotId, chosenSlotId)
        )
      );
    if (otherPendingRound && otherPendingRound.id !== round.id) {
      await db
        .update(schema.draftRounds)
        .set({ formationSlotId: round.formationSlotId })
        .where(eq(schema.draftRounds.id, otherPendingRound.id));
    }
  }

  // Update round formationSlotId to the chosen slot
  await db.update(schema.draftRounds).set({ formationSlotId: chosenSlotId }).where(eq(schema.draftRounds.id, round.id));

  await db.insert(schema.draftSelections).values({
    draftRoundId: round.id,
    playerSeasonId,
    formationSlotId: slot.id,
    positionalFitScore: fit,
  });
  await db.update(schema.draftRounds).set({ status: "resolved" }).where(eq(schema.draftRounds.id, round.id));

  const remainingRounds = await db
    .select()
    .from(schema.draftRounds)
    .where(and(eq(schema.draftRounds.draftId, draftId), eq(schema.draftRounds.status, "pending")));

  if (remainingRounds.length === 0) {
    return { draftComplete: true };
  }
  return { draftComplete: false };
}

export async function finalizeDraftTeam(draftId: number) {
  const [draft] = await db.select().from(schema.drafts).where(eq(schema.drafts.id, draftId));
  if (!draft) throw new DraftEngineError("Draft not found");

  const formationRow = (await db.select().from(schema.formations).where(eq(schema.formations.id, draft.formationId)))[0];
  const formationCfg = getFormation(formationRow.code);
  if (!formationCfg) throw new DraftEngineError("Formation config missing");

  const selections = await db
    .select({
      selection: schema.draftSelections,
      round: schema.draftRounds,
    })
    .from(schema.draftSelections)
    .innerJoin(schema.draftRounds, eq(schema.draftSelections.draftRoundId, schema.draftRounds.id))
    .where(eq(schema.draftRounds.draftId, draftId));

  if (selections.length !== formationCfg.slots.length) {
    throw new DraftEngineError("Draft is not yet complete");
  }

  const rated: RatedPlayer[] = [];
  for (const { selection } of selections) {
    const [row] = await db
      .select({ playerSeason: schema.playerSeasons, player: schema.players })
      .from(schema.playerSeasons)
      .innerJoin(schema.players, eq(schema.playerSeasons.playerId, schema.players.id))
      .where(eq(schema.playerSeasons.id, selection.playerSeasonId));
    const [slot] = await db.select().from(schema.formationSlots).where(eq(schema.formationSlots.id, selection.formationSlotId));
    rated.push({
      formationSlotId: slot.id,
      slotOrder: slot.slotOrder,
      primaryRole: slot.primaryRole,
      overall: applyRatingModel(row.playerSeason.overall, row.playerSeason.performanceTier, draft.ratingModel as RatingModel),
      positionalFitScore: selection.positionalFitScore ?? 1,
      nationality: row.player.nationality ?? "Unknown",
      performanceTier: row.playerSeason.performanceTier,
    });
  }

  const breakdown = computeTeamRating(formationCfg, rated);

  // Check if team already exists, clean up to prevent unique constraint crash
  const existingTeams = await db.select().from(schema.teams).where(eq(schema.teams.draftId, draftId));
  if (existingTeams.length > 0) {
    for (const et of existingTeams) {
      await db.delete(schema.teamPlayers).where(eq(schema.teamPlayers.teamId, et.id));
      await db.delete(schema.teams).where(eq(schema.teams.id, et.id));
    }
  }

  const [team] = await db
    .insert(schema.teams)
    .values({
      draftId,
      overall: breakdown.overall,
      attack: breakdown.attack,
      midfield: breakdown.midfield,
      defence: breakdown.defence,
      goalkeeping: breakdown.goalkeeping,
      physical: breakdown.physical,
      chemistry: breakdown.chemistry,
      positionalFit: breakdown.positionalFit,
      balance: breakdown.balance,
      tacticalFit: breakdown.tacticalFit,
      tacticalIdentity: breakdown.tacticalIdentity,
      ratingBreakdown: JSON.stringify(breakdown.explanation),
      chemistryBreakdown: JSON.stringify(breakdown.chemistryExplanation),
    })
    .returning();

  for (const { selection } of selections) {
    await db.insert(schema.teamPlayers).values({
      teamId: team.id,
      playerSeasonId: selection.playerSeasonId,
      formationSlotId: selection.formationSlotId,
    });
  }

  await db.update(schema.drafts).set({ status: "complete", completedAt: new Date().toISOString() }).where(eq(schema.drafts.id, draftId));

  return { team, breakdown };
}
