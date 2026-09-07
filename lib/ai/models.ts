// Free models in priority order, used only for grading free-text answers.
// Grading must answer within ~9s, so the fastest go first. They rotate, and
// a dead entry fails instantly, so check them against the live :free list.
export const FREE_MODELS: string[] = [
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "nvidia/nemotron-3.5-lightning:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "liquid/lfm-2.5-2.6b:free",
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
