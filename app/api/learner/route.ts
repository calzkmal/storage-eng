import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  id: z.string().min(8).max(64),
  name: z.string().trim().min(1).max(40),
});

/** Creates or renames the anonymous profile. The id is minted in the browser. */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "id and name are required" }, { status: 400 });

  const db = getDb();
  // Without a database the profile still works locally.
  if (!db) return NextResponse.json({ ok: true, stored: false });

  const { error } = await db
    .from("learners")
    .upsert(
      { id: parsed.data.id, name: parsed.data.name, last_seen_at: new Date().toISOString() },
      { onConflict: "id" },
    );
  if (error) {
    console.error("[learner] upsert failed:", error.message);
    return NextResponse.json({ error: "Could not save the profile" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
