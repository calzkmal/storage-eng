import { NextResponse } from "next/server";
import { z } from "zod";
import { getLesson, isDbConfigured, saveGeneratedSet } from "@/lib/content";
import { generateLessonExercises } from "@/lib/ai/generate";
import { checkRateLimit, GENERATE_LIMIT, getClientIp } from "@/lib/ai/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BodySchema = z.object({ lessonId: z.string().min(1).max(100) });

/** Generates a new set for one lesson, stores it as the next version, and activates it. */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "lessonId is required" }, { status: 400 });

  const lesson = await getLesson(parsed.data.lessonId);
  if (!lesson) return NextResponse.json({ error: "Unknown lesson" }, { status: 404 });

  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Question database is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 },
    );
  }

  const rl = checkRateLimit(`gen:${getClientIp(req)}`, GENERATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many regenerations. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const started = Date.now();
  const outcome = await generateLessonExercises(lesson);
  console.log(
    `[ai/generate] lesson=${lesson.id} ok=${outcome.ok} model=${outcome.modelUsed} attempts=${outcome.attempts} ms=${Date.now() - started}`,
  );

  if (!outcome.ok) {
    return NextResponse.json(
      { error: "The AI could not produce a valid set this time. Please try again.", detail: outcome.error, problems: outcome.problems ?? [] },
      { status: 502 },
    );
  }

  try {
    const saved = await saveGeneratedSet(lesson.id, outcome.exercises, outcome.modelUsed);
    console.log(`[ai/generate] stored lesson=${lesson.id} set=${saved.setId} version=${saved.version}`);
    return NextResponse.json({
      lessonId: lesson.id,
      setId: saved.setId,
      version: saved.version,
      exerciseCount: outcome.exercises.length,
      modelUsed: outcome.modelUsed,
      attempts: outcome.attempts,
    });
  } catch (err) {
    console.error("[ai/generate] store failed:", err);
    return NextResponse.json(
      { error: "Generated a set but could not store it in the database.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
