import { NextRequest, NextResponse } from "next/server";
import { selectPlayer, DraftEngineError } from "@/lib/services/draft-service";
import { parsePositiveInteger, readJsonBody } from "../route-utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draftId = parsePositiveInteger(id, "draft id");
  if (draftId.error) return draftId.error;

  const body = await readJsonBody(req);
  const roundNumber = parsePositiveInteger(body.roundNumber, "round number");
  if (roundNumber.error) return roundNumber.error;
  const playerSeasonId = parsePositiveInteger(body.playerSeasonId, "player-season id");
  if (playerSeasonId.error) return playerSeasonId.error;

  let targetSlotId: number | undefined;
  if (body.targetSlotId !== undefined && body.targetSlotId !== null && body.targetSlotId !== "") {
    const parsedTargetSlotId = parsePositiveInteger(body.targetSlotId, "target slot id");
    if (parsedTargetSlotId.error) return parsedTargetSlotId.error;
    targetSlotId = parsedTargetSlotId.value;
  }

  try {
    const result = await selectPlayer(draftId.value, roundNumber.value, playerSeasonId.value, targetSlotId);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof DraftEngineError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
