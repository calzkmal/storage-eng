import type { Exercise } from "../schema";
import type { GradeRequest, GradeResponse } from "./types";

const CLIENT_TIMEOUT_MS = 10_000; // spec §4.4

import { TARGET_NAME, TARGET_REQUIREMENT } from "../flipTargets";

/** Build the request body for an AI-graded exercise. */
export function buildGradeRequest(ex: Exercise, userAnswer: string): GradeRequest | null {
  if (ex.type === "free_write") {
    return {
      exerciseId: ex.id,
      type: "free_write",
      userAnswer,
      context: { task: ex.task, requirements: ex.requirements, modelAnswer: ex.modelAnswer, acceptedAnswers: [] },
    };
  }
  if (ex.type === "flip_sentence") {
    return {
      exerciseId: ex.id,
      type: "flip_sentence",
      userAnswer,
      context: {
        task: `Rewrite the sentence "${ex.source}" in the ${TARGET_NAME[ex.target]} form.`,
        requirements: [TARGET_REQUIREMENT[ex.target]],
        modelAnswer: ex.answer[0],
        acceptedAnswers: ex.answer,
      },
    };
  }
  return null;
}

/**
 * POST /api/ai/grade with a 10s timeout.
 * Returns null on timeout, network error, 429, or any non-OK response so the
 * caller can show the model-answer fallback.
 */
export async function requestAIGrade(req: GradeRequest): Promise<GradeResponse | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch("/api/ai/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<GradeResponse>;
    if (typeof data.correct !== "boolean" || typeof data.correctedAnswer !== "string") return null;
    return data as GradeResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
