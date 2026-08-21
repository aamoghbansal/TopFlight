import { NextRequest, NextResponse } from "next/server";
import { finalizeDraftTeam, DraftEngineError } from "@/lib/services/draft-service";
import { parsePositiveInteger } from "../route-utils";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draftId = parsePositiveInteger(id, "draft id");
  if (draftId.error) return draftId.error;

  try {
    const result = await finalizeDraftTeam(draftId.value);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof DraftEngineError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
