import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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

/** Every answer for one profile, newest run first. The learner id is the only key. */
export async function GET(req: Request) {
  const learnerId = new URL(req.url).searchParams.get("learnerId");
  if (!learnerId || learnerId.length < 8 || learnerId.length > 64) {
    return NextResponse.json({ error: "learnerId is required" }, { status: 400 });
  }

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
