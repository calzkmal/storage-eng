import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { badRequest, refuseCrossSite } from "@/lib/http";
import { checkRateLimit, getClientKey, WRITE_LIMIT } from "@/lib/rateLimit";
import { readLearnerId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// No learner id or name here: both come from the signed cookie, so an answer
// cannot be filed against, or rename, someone else's profile.
const BodySchema = z.object({
  runId: z.string().min(8).max(64),
  lessonId: z.string().min(1).max(100),
  lessonTitle: z.string().min(1).max(200),
  setId: z.string().max(100).nullable().optional(),
  exerciseId: z.string().min(1).max(100),
  exerciseType: z.string().min(1).max(40),
  phase: z.enum(["main", "review"]),
  question: z.string().max(600),
  userAnswer: z.string().max(600),
  correctAnswer: z.string().max(600),
  correct: z.boolean().nullable(),
  gradedBy: z.enum(["local", "ai", "cache", "fallback"]),
});

/** Records one checked answer. Best effort: failures are logged, not surfaced. */
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
  if (!parsed.success) return badRequest("Invalid attempt");

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

  const a = parsed.data;
  // Insert only. The profile row is created by /api/learner; a missing one
  // fails the foreign key rather than being conjured up from request data.
  const { error } = await db.from("attempts").insert({
    learner_id: learnerId,
    run_id: a.runId,
    lesson_id: a.lessonId,
    lesson_title: a.lessonTitle,
    set_id: a.setId ?? null,
    exercise_id: a.exerciseId,
    exercise_type: a.exerciseType,
    phase: a.phase,
    question: a.question,
    user_answer: a.userAnswer,
    correct_answer: a.correctAnswer,
    correct: a.correct,
    graded_by: a.gradedBy,
  });
  if (error) {
    console.error("[attempts] insert failed:", error.message);
    return NextResponse.json({ error: "Could not record the answer" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
