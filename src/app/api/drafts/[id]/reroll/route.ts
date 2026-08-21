import { NextRequest, NextResponse } from "next/server";
import { rerollRound, DraftEngineError, type RerollType } from "@/lib/services/draft-service";
import { parsePositiveInteger, readJsonBody } from "../route-utils";

const REROLL_TYPES = new Set<RerollType>(["club", "era", "full"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draftId = parsePositiveInteger(id, "draft id");
  if (draftId.error) return draftId.error;

  const body = await readJsonBody(req);
  const roundNumber = parsePositiveInteger(body.roundNumber, "round number");
  if (roundNumber.error) return roundNumber.error;

  const type = body.type ?? "club";
  if (!REROLL_TYPES.has(type)) {
    return NextResponse.json({ error: "reroll type must be club, era, or full" }, { status: 400 });
  }

  try {
    const result = await rerollRound(draftId.value, roundNumber.value, type);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof DraftEngineError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
