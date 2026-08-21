import { NextRequest, NextResponse } from "next/server";
import { runSeason } from "@/lib/services/season-service";
import { parsePositiveInteger } from "../route-utils";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draftId = parsePositiveInteger(id, "draft id");
  if (draftId.error) return draftId.error;

  try {
    const result = await runSeason(draftId.value);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Simulation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
