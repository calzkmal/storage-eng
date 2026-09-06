import type { Exercise } from "./schema";

/**
 * Matching gives instant feedback per pair, so by the time Check is pressed
 * every connected pair is correct; `mistakes` counts wrong taps along the way.
 */
export type MatchingAnswer = { pairs: Record<string, string>; mistakes: number };

/** Answer value produced by each exercise component. */
export type AnswerValue =
  | string // multiple_choice, fill_blank, flip_sentence, free_write
  | string[] // word_order: placed words in order
  | MatchingAnswer; // matching

export function isMatchingAnswer(v: AnswerValue | null): v is MatchingAnswer {
  return typeof v === "object" && v !== null && !Array.isArray(v) && "pairs" in v;
}

export type LocalGrade = { correct: boolean; correctAnswer: string };

const fixQuotes = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');

/** trim, lowercase, collapse spaces, strip trailing period/punctuation. */
export function normalize(s: string): string {
  return fixQuotes(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .trim();
}

/** Like normalize, but strips all punctuation except apostrophes. */
export function normalizeLoose(s: string): string {
  return fixQuotes(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Human-readable correct answer for the feedback panel and the done screen. */
export function correctAnswerText(ex: Exercise): string {
  switch (ex.type) {
    case "multiple_choice":
      return ex.answer;
    case "fill_blank":
      return ex.answer[0];
    case "word_order":
      return ex.answer;
    case "matching":
      return ex.pairs.map((p) => `${p.left} → ${p.right}`).join(", ");
    case "flip_sentence":
      return ex.answer[0];
    case "free_write":
      return ex.modelAnswer;
  }
}

/** Short text used to identify the exercise on the done screen. */
export function exerciseSummary(ex: Exercise): string {
  switch (ex.type) {
    case "multiple_choice":
      return ex.question;
    case "fill_blank":
      return ex.sentence;
    case "word_order":
      return `Order: ${ex.words.join(" / ")}`;
    case "matching":
      return ex.prompt;
    case "flip_sentence":
      return `${ex.source} → ${ex.target}`;
    case "free_write":
      return ex.task;
  }
}

/** Format a user's answer for display. */
export function answerText(ex: Exercise, value: AnswerValue): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(" ");
  if (ex.type === "matching" && isMatchingAnswer(value)) {
    const pairs = ex.pairs.map((p) => `${p.left} → ${value.pairs[p.left] ?? "?"}`).join(", ");
    return value.mistakes > 0 ? `${pairs} (${value.mistakes} wrong tap${value.mistakes === 1 ? "" : "s"})` : pairs;
  }
  return JSON.stringify(value);
}

/** Whether the answer is complete enough to enable "Check". */
export function canCheck(ex: Exercise, value: AnswerValue | null): boolean {
  if (value == null) return false;
  switch (ex.type) {
    case "multiple_choice":
      return typeof value === "string" && value.length > 0;
    case "fill_blank":
    case "flip_sentence":
    case "free_write":
      return typeof value === "string" && value.trim().length > 0;
    case "word_order":
      return Array.isArray(value) && value.length === ex.words.length;
    case "matching":
      return isMatchingAnswer(value) && ex.pairs.every((p) => typeof value.pairs[p.left] === "string");
  }
}

/**
 * Grade locally. Returns null when the exercise needs the AI
 * (free_write always; flip_sentence when no accepted answer matches).
 */
export function gradeLocal(ex: Exercise, value: AnswerValue): LocalGrade | null {
  const correctAnswer = correctAnswerText(ex);
  switch (ex.type) {
    case "multiple_choice":
      return { correct: value === ex.answer, correctAnswer };
    case "fill_blank": {
      const v = normalize(String(value));
      return { correct: ex.answer.some((a) => normalize(a) === v), correctAnswer };
    }
    case "word_order": {
      const joined = Array.isArray(value) ? value.join(" ") : String(value);
      return { correct: normalizeLoose(joined) === normalizeLoose(ex.answer), correctAnswer };
    }
    case "matching": {
      if (!isMatchingAnswer(value)) return { correct: false, correctAnswer };
      // Pairs are checked as they are tapped, so a completed board is always
      // right; the exercise counts as wrong if any tap along the way was wrong.
      const allRight = ex.pairs.every((p) => value.pairs[p.left] === p.right);
      return { correct: allRight && value.mistakes === 0, correctAnswer };
    }
    case "flip_sentence": {
      const v = normalizeLoose(String(value));
      const match = ex.answer.some((a) => normalizeLoose(a) === v);
      return match ? { correct: true, correctAnswer } : null;
    }
    case "free_write":
      return null;
  }
}
