import { NextResponse } from "next/server";
import { FORMATIONS } from "@/lib/config/formations";

export async function GET() {
  return NextResponse.json({
    formations: FORMATIONS.map((f) => ({ code: f.code, label: f.label, slotCount: f.slots.length })),
  });
}
