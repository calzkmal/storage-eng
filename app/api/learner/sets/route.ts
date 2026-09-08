import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { badRequest, refuseCrossSite } from "@/lib/http";
import { checkRateLimit, getClientKey, WRITE_LIMIT } from "@/lib/rateLimit";
import { readLearnerId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  lessonId: z.string().min(1).max(100),
  setId: z.string().uuid(),
});

/** Flags one question set as finished. The learner comes from the cookie. */
export async function POST(req: NextRequest) {
  const refused = refuseCrossSite(req);
  if (refused) return refused;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return badRequest("Invalid body");

  const client = getClientKey(req);
  if (!client) return badRequest("Could not identify the client");
  const rl = await checkRateLimit(`write:${client}`, WRITE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const learnerId = readLearnerId(req);
  if (!learnerId) return NextResponse.json({ ok: true, stored: false });

  const db = getDb();
  if (!db) return NextResponse.json({ ok: true, stored: false });

  const { error } = await db
    .from("learner_sets")
    .upsert(
      { learner_id: learnerId, set_id: parsed.data.setId, lesson_id: parsed.data.lessonId },
      { onConflict: "learner_id,set_id" },
    );
  if (error) {
    console.error("[learner/sets] upsert failed:", error.message);
    return NextResponse.json({ error: "Could not flag the set" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
