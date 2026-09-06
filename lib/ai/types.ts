/** Shared types for the AI grading layer (spec §7.1). */

export type GradeType = "free_write" | "flip_sentence";

export type GradeContext = {
  task: string;
  requirements: string[];
  modelAnswer: string;
  acceptedAnswers: string[];
};

export type GradeRequest = {
  exerciseId: string;
  type: GradeType;
  userAnswer: string;
  context: GradeContext;
};

/** What the model is asked to return. */
export type GradeResult = {
  correct: boolean;
  correctedAnswer: string;
  explanation: string;
};

export type GradeSource = "ai" | "cache" | "fallback";

/** Response shape of POST /api/ai/grade. Always this shape, even on fallback. */
export type GradeResponse = GradeResult & {
  source: GradeSource;
  modelUsed: string;
};
