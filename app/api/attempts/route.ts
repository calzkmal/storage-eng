import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  learnerId: z.string().min(8).max(64),
  learnerName: z.string().trim().min(1).max(40),
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

/**
 * POST /api/attempts
 * Records one checked answer for the history screen. Best effort: a failure
 * here must never disturb the lesson, so problems are logged, not surfaced.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });

  const db = getDb();
  if (!db) return NextResponse.json({ ok: true, stored: false });

  const a = parsed.data;
  // Keep the profile row alive even if the learner was created before the
  // database was configured, so the attempt's foreign key holds.
  const { error: learnerErr } = await db
    .from("learners")
    .upsert({ id: a.learnerId, name: a.learnerName, last_seen_at: new Date().toISOString() }, { onConflict: "id" });
  if (learnerErr) {
    console.error("[attempts] learner upsert failed:", learnerErr.message);
    return NextResponse.json({ error: "Could not record the answer" }, { status: 500 });
  }

  const { error } = await db.from("attempts").insert({
    learner_id: a.learnerId,
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
