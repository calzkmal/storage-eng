import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { findExercise } from "@/lib/content";
import { cacheKey, gradeCache } from "@/lib/ai/cache";
import { gradeWithModel } from "@/lib/ai/grade";
import { checkRateLimit, getClientKey, GRADE_LIMIT } from "@/lib/rateLimit";
import { badRequest, refuseCrossSite } from "@/lib/http";
import { TARGET_NAME, TARGET_REQUIREMENT } from "@/lib/flipTargets";
import type { GradeContext, GradeResponse } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTROL_CHARS = /[\u0000-\u0008\u000b-\u001f\u007f]/;

// Control characters and multi-line payloads are the vehicle for prompt
// injection and are never a real answer, so they stop here.
const UserAnswer = z
  .string()
  .min(1)
  .max(300, "Answer must be 300 characters or fewer")
  .refine((s) => !CONTROL_CHARS.test(s), "Answer contains control characters")
  .refine((s) => (s.match(/\n/g) ?? []).length <= 2, "Answer has too many line breaks");

const BodySchema = z.object({
  exerciseId: z.string().min(1).max(100),
  type: z.enum(["free_write", "flip_sentence"]),
  userAnswer: UserAnswer,
});

/**
 * Built only from our own copy of the exercise. The caller used to be able to
 * supply this, which turned the route into an open proxy to the grading models.
 */
async function resolveContext(exerciseId: string): Promise<GradeContext | null> {
  const ex = await findExercise(exerciseId);
  if (ex?.type === "free_write") {
    return { task: ex.task, requirements: ex.requirements, modelAnswer: ex.modelAnswer, acceptedAnswers: [] };
  }
  if (ex?.type === "flip_sentence") {
    return {
      task: `Rewrite the sentence "${ex.source}" in the ${TARGET_NAME[ex.target]} form.`,
      requirements: [TARGET_REQUIREMENT[ex.target]],
      modelAnswer: ex.answer[0],
      acceptedAnswers: ex.answer,
    };
  }
  return null;
}

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
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
      { status: 400 },
    );
  }

  const { exerciseId, userAnswer } = parsed.data;
  const ctx = await resolveContext(exerciseId);
  if (!ctx) return badRequest("Unknown exercise");

  const key = cacheKey(exerciseId, userAnswer);
  const hit = gradeCache.get(key);
  if (hit) {
    const body: GradeResponse = { ...hit, source: "cache" };
    return NextResponse.json(body);
  }

  const client = getClientKey(req);
  if (!client) return badRequest("Could not identify the client");

  const rl = await checkRateLimit(`grade:${client}`, GRADE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const started = Date.now();
  const outcome = await gradeWithModel(ctx, userAnswer);
  const ms = Date.now() - started;

  let body: GradeResponse;
  if (outcome.ok) {
    body = { ...outcome.result, source: "ai", modelUsed: outcome.modelUsed };
    // Never cache fallbacks. The answer already passed the checks above, so a
    // poisoned reply cannot be parked here for the next learner.
    gradeCache.set(key, { ...outcome.result, modelUsed: outcome.modelUsed });
  } else {
    body = {
      correct: false,
      correctedAnswer: ctx.modelAnswer,
      explanation: "Bandingkan kalimatmu dengan contoh jawaban.",
      source: "fallback",
      modelUsed: outcome.modelUsed,
    };
  }

  console.log(
    `[ai/grade] exercise=${exerciseId} source=${body.source} model=${body.modelUsed} ms=${ms}` +
      (outcome.ok ? "" : ` reason=${outcome.reason}`),
  );

  return NextResponse.json(body);
}
