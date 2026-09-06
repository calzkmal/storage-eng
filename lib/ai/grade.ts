import { chatCompletion, OpenRouterError, type ChatMessage } from "./openrouter";
import { getModels } from "./models";
import { buildUserMessage, JSON_NUDGE, parseGradeJson, SYSTEM_PROMPT } from "./prompt";
import type { GradeContext, GradeResult } from "./types";

const CALL_TIMEOUT_MS = 9000; // spec §7.1 step 4
const TOTAL_BUDGET_MS = 9500; // keep under the client's 10s timeout
const MIN_RETRY_MS = 1500;
// Spec says 300, but some free models count hidden reasoning tokens against
// max_tokens and return an empty reply when the budget runs out. We also ask
// OpenRouter to disable reasoning for grading: the reply is a 3-field JSON.
const MAX_TOKENS = 600;
const GRADE_OPTS = { maxTokens: MAX_TOKENS, disableReasoning: true } as const;

export type ModelGradeOutcome =
  | { ok: true; result: GradeResult; modelUsed: string }
  | { ok: false; modelUsed: string; reason: string };

/**
 * Ask the model to grade; retry ONCE on JSON-parse failure (spec §7.1 step 5).
 * Any other failure (no key, timeout, all models failed) returns ok: false so the
 * caller can take the fallback path.
 */
export async function gradeWithModel(ctx: GradeContext, userAnswer: string): Promise<ModelGradeOutcome> {
  const models = getModels();
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserMessage(ctx, userAnswer) },
  ];

  const started = Date.now();
  let modelUsed = "none";

  try {
    const first = await chatCompletion(messages, { models, timeoutMs: CALL_TIMEOUT_MS, ...GRADE_OPTS });
    modelUsed = first.model;
    const parsed = parseGradeJson(first.content);
    if (parsed) return { ok: true, result: parsed, modelUsed };

    const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
    const retry = await chatCompletion(
      [...messages, { role: "assistant", content: first.content }, { role: "user", content: JSON_NUDGE }],
      { models, timeoutMs: Math.max(MIN_RETRY_MS, remaining), ...GRADE_OPTS },
    );
    modelUsed = retry.model;
    const parsedRetry = parseGradeJson(retry.content);
    if (parsedRetry) return { ok: true, result: parsedRetry, modelUsed };

    return { ok: false, modelUsed, reason: "json_parse_failed_twice" };
  } catch (err) {
    const reason = err instanceof OpenRouterError ? `${err.kind}: ${err.message}` : String(err);
    return { ok: false, modelUsed, reason };
  }
}
