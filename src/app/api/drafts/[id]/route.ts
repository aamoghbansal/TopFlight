import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { ensureDatabaseInitialized } from "@/db/init";
import { parsePositiveInteger } from "./route-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draftId = parsePositiveInteger(id, "draft id");
  if (draftId.error) return draftId.error;

  await ensureDatabaseInitialized();

  const [draft] = await db.select().from(schema.drafts).where(eq(schema.drafts.id, draftId.value));
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const [league] = await db.select().from(schema.leagues).where(eq(schema.leagues.id, draft.leagueId));
  const [formation] = await db.select().from(schema.formations).where(eq(schema.formations.id, draft.formationId));

  const rounds = await db
    .select()
    .from(schema.draftRounds)
    .where(eq(schema.draftRounds.draftId, draftId.value))
    .orderBy(schema.draftRounds.roundNumber);

  const slots = await db
    .select()
    .from(schema.formationSlots)
    .where(eq(schema.formationSlots.formationId, draft.formationId))
    .orderBy(schema.formationSlots.slotOrder);

  const selections = await db
    .select({ selection: schema.draftSelections, round: schema.draftRounds })
    .from(schema.draftSelections)
    .innerJoin(schema.draftRounds, eq(schema.draftSelections.draftRoundId, schema.draftRounds.id))
    .where(eq(schema.draftRounds.draftId, draftId.value));

  const resolvedRoundIds = new Set(selections.map((s) => s.round.id));
  const enrichedRounds = [];
  for (const round of rounds) {
    const sel = selections.find((s) => s.round.id === round.id);
    let playerSeason = null;
    if (sel) {
      const [row] = await db
        .select({ playerSeason: schema.playerSeasons, player: schema.players })
        .from(schema.playerSeasons)
        .innerJoin(schema.players, eq(schema.playerSeasons.playerId, schema.players.id))
        .where(eq(schema.playerSeasons.id, sel.selection.playerSeasonId));
      playerSeason = { ...row.playerSeason, fullName: row.player.fullName, nationality: row.player.nationality };
    }
    enrichedRounds.push({
      ...round,
      selection: sel ? { ...sel.selection, playerSeason } : null,
    });
  }

  return NextResponse.json({
    draft,
    league,
    formation,
    slots,
    rounds: enrichedRounds,
    isComplete: rounds.every((r) => resolvedRoundIds.has(r.id)),
  });
}
