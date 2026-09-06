import { NextResponse } from "next/server";
import { z } from "zod";
import { findExercise } from "@/lib/content";
import { cacheKey, gradeCache } from "@/lib/ai/cache";
import { gradeWithModel } from "@/lib/ai/grade";
import { checkRateLimit, getClientIp } from "@/lib/ai/rateLimit";
import type { GradeContext, GradeResponse } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ContextSchema = z.object({
  task: z.string().max(500),
  requirements: z.array(z.string().max(100)).max(10).default([]),
  modelAnswer: z.string().max(300),
  acceptedAnswers: z.array(z.string().max(300)).max(10).default([]),
});

const BodySchema = z.object({
  exerciseId: z.string().min(1).max(100),
  type: z.enum(["free_write", "flip_sentence"]),
  userAnswer: z.string().min(1).max(300, "Answer must be 300 characters or fewer"),
  context: ContextSchema.optional(),
});

const TARGET_REQUIREMENT: Record<string, string> = {
  negative: "negative with don't/doesn't + base verb",
  past: "past simple (regular -ed or the irregular forms went, ate, had, saw, did, wrote)",
  future: "future with will/won't + base verb",
};

/**
 * Build the grading context. If the exercise exists in our content, use the
 * server-side copy so clients cannot tamper with the prompt; otherwise fall
 * back to the client-provided context.
 */
async function resolveContext(exerciseId: string, provided?: GradeContext): Promise<GradeContext | null> {
  const ex = await findExercise(exerciseId);
  if (ex?.type === "free_write") {
    return { task: ex.task, requirements: ex.requirements, modelAnswer: ex.modelAnswer, acceptedAnswers: [] };
  }
  if (ex?.type === "flip_sentence") {
    return {
      task: `Rewrite the sentence "${ex.source}" in the ${ex.target} form.`,
      requirements: [TARGET_REQUIREMENT[ex.target]],
      modelAnswer: ex.answer[0],
      acceptedAnswers: ex.answer,
    };
  }
  return provided ?? null;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 1. Validate
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
      { status: 400 },
    );
  }

  const { exerciseId, userAnswer } = parsed.data;
  const ctx = await resolveContext(exerciseId, parsed.data.context);
  if (!ctx) {
    return NextResponse.json({ error: "Unknown exercise and no context provided" }, { status: 400 });
  }

  // 2. Cache
  const key = cacheKey(exerciseId, userAnswer);
  const hit = gradeCache.get(key);
  if (hit) {
    const body: GradeResponse = { ...hit, source: "cache" };
    return NextResponse.json(body);
  }

  // 3. Rate limit
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  // 4-5. Call the model (one JSON retry inside), else fallback
  const started = Date.now();
  const outcome = await gradeWithModel(ctx, userAnswer);
  const ms = Date.now() - started;

  let body: GradeResponse;
  if (outcome.ok) {
    body = { ...outcome.result, source: "ai", modelUsed: outcome.modelUsed };
    // 6. Cache only real results, never fallbacks.
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
