import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { ensureDatabaseInitialized } from "@/db/init";

export async function GET() {
  await ensureDatabaseInitialized();
  const leagues = await db.select().from(schema.leagues);
  return NextResponse.json({ leagues });
}
