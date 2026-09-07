// Helpers for writing exercise pools compactly. `id` is filled in at build time.
import type { Exercise } from "../../lib/schema";
import type { FlipTarget } from "../../lib/flipTargets";

// Distributive, so each member of the Exercise union keeps its own fields.
type OmitId<T> = T extends unknown ? Omit<T, "id"> : never;
export type PoolItem = OmitId<Exercise>;

export const mc = (prompt: string, question: string, options: string[], answer: string, explanation: string): PoolItem => ({
  type: "multiple_choice",
  prompt,
  question,
  options,
  answer,
  explanation,
});

export const fb = (prompt: string, sentence: string, answer: string[], explanation: string): PoolItem => ({
  type: "fill_blank",
  prompt,
  sentence,
  answer,
  explanation,
});

/** `words` is derived from the answer, so the two can never disagree. */
export const wo = (prompt: string, answer: string, explanation: string): PoolItem => ({
  type: "word_order",
  prompt,
  words: answer.split(/\s+/),
  answer,
  explanation,
});

export const match = (prompt: string, pairs: [string, string][], explanation: string): PoolItem => ({
  type: "matching",
  prompt,
  pairs: pairs.map(([left, right]) => ({ left, right })),
  explanation,
});

export const flip = (
  prompt: string,
  source: string,
  target: FlipTarget,
  answer: string[],
  explanation: string,
): PoolItem => ({ type: "flip_sentence", prompt, source, target, answer, explanation });

export const fw = (
  prompt: string,
  task: string,
  requirements: string[],
  modelAnswer: string,
  explanation: string,
): PoolItem => ({ type: "free_write", prompt, task, requirements, modelAnswer, explanation });

// Prompts reused across lessons.
export const P = {
  choose: "Choose the correct form",
  chooseWord: "Choose the correct word",
  which: "Which sentence is correct?",
  complete: "Complete the sentence",
  order: "Put the words in the correct order",
  rewrite: "Rewrite the sentence",
  write: "Write your own sentence",
  matchPairs: "Match the pairs",
};

/** Builds a family of fill_blank items that all drill the same rule. */
export function conjugations(
  prompt: string,
  rows: [sentence: string, answer: string, note: string][],
): PoolItem[] {
  return rows.map(([sentence, answer, note]) => fb(prompt, sentence, [answer], note));
}
