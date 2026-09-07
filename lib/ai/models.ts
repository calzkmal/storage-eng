// Free models in priority order, used only for grading free-text answers.
// Order is by measured reliability, not speed: a model that answers empty costs
// a whole extra request. Reasoning models are the worst here, because grading
// runs with reasoning off. They rotate, so recheck against the live :free list.
export const FREE_MODELS: string[] = [
  "nvidia/nemotron-3.5-lightning:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
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
