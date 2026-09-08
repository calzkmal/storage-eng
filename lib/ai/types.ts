// Types for the AI grading layer.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatResult = { content: string; model: string };

export type GradeType = "free_write" | "flip_sentence";

export type GradeContext = {
  task: string;
  requirements: string[];
  modelAnswer: string;
  acceptedAnswers: string[];
};

/** What the browser may send. Context is resolved server-side from our own copy. */
export type GradeRequest = {
  exerciseId: string;
  type: GradeType;
  userAnswer: string;
};

/** What the model returns. */
export type GradeResult = {
  correct: boolean;
  correctedAnswer: string;
  explanation: string;
};

export type GradeSource = "ai" | "cache" | "fallback";

/** Always this shape, even on fallback. */
export type GradeResponse = GradeResult & {
  source: GradeSource;
  modelUsed: string;
};
