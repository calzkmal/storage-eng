import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { badRequest } from "@/lib/http";
import { checkRateLimit, getClientKey, WRITE_LIMIT } from "@/lib/rateLimit";
import { readLearnerId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 600;

export type HistoryAttempt = {
  exerciseId: string;
  exerciseType: string;
  phase: "main" | "review";
  question: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean | null;
  gradedBy: string;
  at: string;
};

export type HistoryRun = {
  runId: string;
  lessonId: string;
  lessonTitle: string;
  startedAt: string;
  answers: HistoryAttempt[];
};

type Row = {
  run_id: string;
  lesson_id: string;
  lesson_title: string;
  exercise_id: string;
  exercise_type: string;
  phase: "main" | "review";
  question: string;
  user_answer: string;
  correct_answer: string;
  correct: boolean | null;
  graded_by: string;
  created_at: string;
};

/**
 * Every answer for the profile in the cookie, newest run first. The id used to
 * come from the query string, which let anyone holding one read that history.
 */
export async function GET(req: NextRequest) {
  const client = getClientKey(req);
  if (!client) return badRequest("Could not identify the client");
  const rl = await checkRateLimit(`read:${client}`, WRITE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const learnerId = readLearnerId(req);
  if (!learnerId) return NextResponse.json({ runs: [], stored: false });

  const db = getDb();
  if (!db) return NextResponse.json({ runs: [], stored: false });

  const { data, error } = await db
    .from("attempts")
    .select(
      "run_id, lesson_id, lesson_title, exercise_id, exercise_type, phase, question, user_answer, correct_answer, correct, graded_by, created_at",
    )
    .eq("learner_id", learnerId)
    .order("created_at", { ascending: false })
    .limit(MAX_ATTEMPTS);
  if (error) {
    console.error("[history] read failed:", error.message);
    return NextResponse.json({ error: "Could not read the history" }, { status: 500 });
  }

  // Group into runs, answers back in the order given.
  const runs = new Map<string, HistoryRun>();
  for (const r of (data ?? []) as Row[]) {
    let run = runs.get(r.run_id);
    if (!run) {
      run = {
        runId: r.run_id,
        lessonId: r.lesson_id,
        lessonTitle: r.lesson_title,
        startedAt: r.created_at,
        answers: [],
      };
      runs.set(r.run_id, run);
    }
    run.answers.unshift({
      exerciseId: r.exercise_id,
      exerciseType: r.exercise_type,
      phase: r.phase,
      question: r.question,
      userAnswer: r.user_answer,
      correctAnswer: r.correct_answer,
      correct: r.correct,
      gradedBy: r.graded_by,
      at: r.created_at,
    });
    if (r.created_at < run.startedAt) run.startedAt = r.created_at;
  }

  return NextResponse.json({ runs: [...runs.values()], stored: true });
}
