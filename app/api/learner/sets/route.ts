import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  learnerId: z.string().min(8).max(64),
  lessonId: z.string().min(1).max(100),
  setId: z.string().uuid(),
});

/** Flags one question set as finished by one learner. */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const db = getDb();
  if (!db) return NextResponse.json({ ok: true, stored: false });

  const { learnerId, lessonId, setId } = parsed.data;
  const { error } = await db
    .from("learner_sets")
    .upsert({ learner_id: learnerId, set_id: setId, lesson_id: lessonId }, { onConflict: "learner_id,set_id" });
  if (error) {
    console.error("[learner/sets] upsert failed:", error.message);
    return NextResponse.json({ error: "Could not flag the set" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
