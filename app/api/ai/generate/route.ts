import { NextResponse } from "next/server";
import { z } from "zod";
import { getLesson } from "@/lib/content";
import { generateLessonExercises } from "@/lib/ai/generate";
import { checkRateLimit, GENERATE_LIMIT, getClientIp } from "@/lib/ai/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BodySchema = z.object({ lessonId: z.string().min(1).max(100) });

/**
 * POST /api/ai/generate  { lessonId }
 * Returns a new, schema-valid exercise set for one lesson using the free-model
 * list. The client stores it on the device; nothing is written on the server.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "lessonId is required" }, { status: 400 });

  const lesson = getLesson(parsed.data.lessonId);
  if (!lesson) return NextResponse.json({ error: "Unknown lesson" }, { status: 404 });

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
  return NextResponse.json({
    lessonId: lesson.id,
    exercises: outcome.exercises,
    modelUsed: outcome.modelUsed,
    attempts: outcome.attempts,
  });
}
