import { chatCompletion, OpenRouterError } from "./openrouter";
import { geminiCompletion, hasGemini } from "./gemini";
import { getModels } from "./models";
import { buildUserMessage, JSON_NUDGE, parseGradeJson, SYSTEM_PROMPT } from "./prompt";
import type { ChatMessage, ChatResult, GradeContext, GradeResult } from "./types";

const CALL_TIMEOUT_MS = 9000; // spec §7.1 step 4
const TOTAL_BUDGET_MS = 9500; // keep under the client's 10s timeout
const MIN_RETRY_MS = 1500;
// 600, not the spec's 300: reasoning tokens count against the budget.
const MAX_TOKENS = 600;

export type ModelGradeOutcome =
  | { ok: true; result: GradeResult; modelUsed: string }
  | { ok: false; modelUsed: string; reason: string };

type Complete = (messages: ChatMessage[], timeoutMs: number) => Promise<ChatResult>;

function reasonOf(err: unknown): string {
  if (err instanceof OpenRouterError) return `${err.kind}: ${err.message}`;
  return err instanceof Error ? err.message : String(err);
}

/** One provider: grade, retrying once if the reply is not JSON. */
async function gradeVia(complete: Complete, messages: ChatMessage[], budgetMs: number): Promise<ModelGradeOutcome> {
  const started = Date.now();
  let modelUsed = "none";

  try {
    const first = await complete(messages, Math.min(CALL_TIMEOUT_MS, budgetMs));
    modelUsed = first.model;
    const parsed = parseGradeJson(first.content);
    if (parsed) return { ok: true, result: parsed, modelUsed };

    const remaining = budgetMs - (Date.now() - started);
    const retry = await complete(
      [...messages, { role: "assistant", content: first.content }, { role: "user", content: JSON_NUDGE }],
      Math.max(MIN_RETRY_MS, remaining),
    );
    modelUsed = retry.model;
    const parsedRetry = parseGradeJson(retry.content);
    if (parsedRetry) return { ok: true, result: parsedRetry, modelUsed };

    return { ok: false, modelUsed, reason: "json_parse_failed_twice" };
  } catch (err) {
    return { ok: false, modelUsed, reason: reasonOf(err) };
  }
}

/** Tries each provider in turn. Any failure returns ok: false with every reason. */
export async function gradeWithModel(ctx: GradeContext, userAnswer: string): Promise<ModelGradeOutcome> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserMessage(ctx, userAnswer) },
  ];

  // Gemini first when configured: OpenRouter's free tier allows only 50 calls a day.
  const providers: [string, Complete][] = [];
  if (hasGemini()) {
    providers.push(["gemini", (m, t) => geminiCompletion(m, { timeoutMs: t, maxTokens: MAX_TOKENS })]);
  }
  providers.push([
    "openrouter",
    (m, t) => chatCompletion(m, { models: getModels(), timeoutMs: t, maxTokens: MAX_TOKENS, disableReasoning: true }),
  ]);

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const failures: string[] = [];
  let modelUsed = "none";

  for (const [name, complete] of providers) {
    const left = deadline - Date.now();
    if (left < MIN_RETRY_MS) break;
    const out = await gradeVia(complete, messages, left);
    if (out.ok) return out;
    modelUsed = out.modelUsed;
    failures.push(`${name}: ${out.reason}`);
  }

  return { ok: false, modelUsed, reason: failures.join(" | ") || "no provider configured" };
}
