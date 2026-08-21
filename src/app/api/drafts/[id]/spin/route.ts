import { NextRequest, NextResponse } from "next/server";
import { spinForRound, DraftEngineError } from "@/lib/services/draft-service";
import { parsePositiveInteger, readJsonBody } from "../route-utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draftId = parsePositiveInteger(id, "draft id");
  if (draftId.error) return draftId.error;

  const body = await readJsonBody(req);
  const roundNumber = parsePositiveInteger(body.roundNumber, "round number");
  if (roundNumber.error) return roundNumber.error;

  try {
    const result = await spinForRound(draftId.value, roundNumber.value);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof DraftEngineError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
