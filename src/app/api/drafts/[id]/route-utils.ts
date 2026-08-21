import { NextResponse } from "next/server";

export function parsePositiveInteger(value: unknown, fieldName: string) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return { error: NextResponse.json({ error: `${fieldName} must be a positive integer` }, { status: 400 }) };
  }
  return { value: parsed };
}

export async function readJsonBody(req: Request) {
  return req.json().catch(() => ({}));
}
