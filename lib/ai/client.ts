import type { Exercise } from "../schema";
import type { GradeRequest, GradeResponse } from "./types";

const CLIENT_TIMEOUT_MS = 10_000;

/**
 * Request body for an AI-graded exercise. Only the id and the answer: the server
 * builds the prompt from its own copy of the exercise.
 */
export function buildGradeRequest(ex: Exercise, userAnswer: string): GradeRequest | null {
  if (ex.type === "free_write" || ex.type === "flip_sentence") {
    return { exerciseId: ex.id, type: ex.type, userAnswer };
  }
  return null;
}

/** Returns null on timeout, 429 or any non-OK reply, so the caller shows the model answer. */
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
