// Free models in priority order; grading must answer within ~9s, so the
// fastest go first. They rotate: `npm run check-models` finds dead entries.
export const FREE_MODELS: string[] = [
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "nvidia/nemotron-3.5-lightning:free",
  "minimax/minimax-m3:free",
  "z-ai/glm-5.2:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
];

/** `OPENROUTER_MODELS` overrides the list, for testing fallback. */
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
