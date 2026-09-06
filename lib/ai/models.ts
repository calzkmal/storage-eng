/**
 * Priority list of OpenRouter free models (spec §7.2).
 * OpenRouter tries these in order and falls back automatically on
 * rate limits, downtime, moderation refusals, or context errors.
 *
 * Free models rotate. Run `npm run check-models` to see which entries
 * no longer exist and update this list.
 *
 * Verified against GET https://openrouter.ai/api/v1/models on 2026-09-06.
 */
export const FREE_MODELS: string[] = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "z-ai/glm-5.2:free",
  "minimax/minimax-m2.7:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3.5-lightning:free",
];

/**
 * Models actually used at runtime. `OPENROUTER_MODELS` (comma-separated)
 * overrides the list, which is handy for testing fallback by putting an
 * invalid ID first, e.g. OPENROUTER_MODELS="bogus/nope:free,google/gemma-4-31b-it:free".
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
