/**
 * Priority list of OpenRouter free models (spec §7.2), as chosen by the
 * project owner. OpenRouter accepts at most 3 entries per request, so
 * lib/ai/openrouter.ts sends this list in chunks of 3 and only moves to the
 * next chunk when the whole chunk failed (rate limit, downtime, error).
 *
 * The order matters for grading, which must answer within ~9 seconds.
 * Probe on 2026-09-06 with a short grading prompt:
 *   nemotron-3-nano-omni   ~0.8 s, valid JSON
 *   nemotron-3.5-lightning ~0.9 s with reasoning off (with reasoning on it
 *                          spends the whole token budget thinking)
 *   minimax-m3             ~1.9 s, valid JSON
 *   glm-5.2 / gemma-4      often 429 (free tier busy)
 *   nemotron-3-ultra       10 s or more; fine for generation, too slow to lead
 *
 * Free models rotate. Run `npm run check-models` to see which entries no
 * longer exist and update this list.
 */
export const FREE_MODELS: string[] = [
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "nvidia/nemotron-3.5-lightning:free",
  "minimax/minimax-m3:free",
  "z-ai/glm-5.2:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
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
