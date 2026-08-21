import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDraft, DraftEngineError } from "@/lib/services/draft-service";

const CreateDraftSchema = z.object({
  leagueCode: z.string(),
  formationCode: z.string(),
  mode: z.enum(["classic", "squad_first", "position_first"]).default("classic"),
  difficulty: z.enum(["easy", "normal", "hard"]).default("normal"),
  ratingVisibility: z.enum(["visible", "blind"]).default("visible"),
  ratingModel: z.enum(["career_season", "prime"]).default("career_season"),
  era: z.enum(["all_time", "1990s", "2000s", "2010s", "modern"]).default("all_time"),
  seasonReveal: z.enum(["live", "instant"]).default("instant"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = CreateDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const draft = await createDraft({ userId: null, ...parsed.data });
    return NextResponse.json({ draft });
  } catch (e) {
    if (e instanceof DraftEngineError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
