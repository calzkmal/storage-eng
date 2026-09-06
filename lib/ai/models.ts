/**
 * Priority list of OpenRouter free models (spec §7.2).
 * OpenRouter tries these in order and falls back automatically on
 * rate limits, downtime, moderation refusals, or context errors.
 *
 * OpenRouter accepts at most 3 entries per request, so lib/ai/openrouter.ts
 * sends the list in chunks of 3 and only moves to the next chunk when the
 * whole chunk failed.
 *
 * Free models rotate. Run `npm run check-models` to see which entries
 * no longer exist and update this list.
 *
 * Order chosen from a probe on 2026-09-06: the first three answered a grading
 * prompt with valid JSON in about a second; the Gemma models were rate-limited
 * at the time but are good when available.
 */
export const FREE_MODELS: string[] = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "inclusionai/ling-3.0-flash-sante:free",
  "minimax/minimax-m3:free",
  "minimax/minimax-m2.7:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
];

/**
 * Models actually used at runtime. `OPENROUTER_MODELS` (comma-separated)
 * overrides the list, which is handy for testing fallback by putting an
 * invalid ID first, e.g. OPENROUTER_MODELS="bogus/nope:free,minimax/minimax-m3:free".
 */
export function getModels(): string[] {
  const env = process.env.OPENROUTER_MODELS;
  if (env && env.trim()) {
    const list = env
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length) return list;
  }
  return FREE_MODELS;
}
