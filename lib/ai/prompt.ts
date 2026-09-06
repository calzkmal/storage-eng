import { z } from "zod";
import { GRAMMAR_SCOPE, IRREGULAR_VERBS } from "./scope";
import type { GradeContext, GradeResult } from "./types";

/** Fixed system prompt (spec §7.3), scoped to the syllabus in lib/ai/scope.ts. */
export const SYSTEM_PROMPT = `You are an English grammar checker for beginners. Judge only these topics:
${GRAMMAR_SCOPE}
Irregular verbs in use (base/past/past participle): ${IRREGULAR_VERBS}
Judge the answer against the requirements you are given, and ignore grammar outside the list above.
Be lenient about spelling of non-grammar words, capitalization, and missing final period. Be strict about the grammar points above.
Respond with JSON only, no markdown, matching exactly:
{"correct": boolean, "correctedAnswer": string, "explanation": string}
"explanation" must be written in Indonesian (Bahasa Indonesia), at most 2 short sentences, friendly, and name the specific rule broken. Keep English grammar terms and example words in English (present simple, will, doesn't). If correct, explanation may be a one-line encouragement or the rule they used well. Never use em dashes. "correctedAnswer" must be the corrected English sentence.`;

export const JSON_NUDGE = `That was not valid JSON. Respond with JSON only, no markdown, no extra text, matching exactly:
{"correct": boolean, "correctedAnswer": string, "explanation": string}`;

export function buildUserMessage(ctx: GradeContext, userAnswer: string): string {
  const lines = [
    `Task: ${ctx.task}`,
    `Requirements the answer must satisfy: ${ctx.requirements.join(", ")}`,
    `Model answer (for reference only): ${ctx.modelAnswer}`,
  ];
  if (ctx.acceptedAnswers.length) {
    lines.push(`Accepted answers: ${ctx.acceptedAnswers.map((a) => `"${a}"`).join(", ")}`);
  }
  lines.push(`Student answer: "${userAnswer}"`);
  return lines.join("\n");
}

const GradeResultSchema = z.object({
  correct: z.boolean(),
  correctedAnswer: z.string(),
  explanation: z.string(),
});

/** Strip ``` fences and any prose around the first {...} block, then parse + validate. */
export function parseGradeJson(raw: string): GradeResult | null {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    const parsed = GradeResultSchema.safeParse(obj);
    if (!parsed.success) return null;
    return {
      correct: parsed.data.correct,
      correctedAnswer: parsed.data.correctedAnswer.trim(),
      explanation: parsed.data.explanation.trim(),
    };
  } catch {
    return null;
  }
}
