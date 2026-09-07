import type { Exercise } from "./schema";

/** Answer value produced by each exercise component. */
export type AnswerValue =
  | string // multiple_choice, fill_blank, flip_sentence, free_write
  | string[] // word_order: placed words in order
  | Record<string, string>; // matching: left text -> right text

function isPairMap(v: AnswerValue | null): v is Record<string, string> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export type LocalGrade = { correct: boolean; correctAnswer: string };

const fixQuotes = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');

/** Trim, lowercase, collapse spaces, strip trailing punctuation. */
export function normalize(s: string): string {
  return fixQuotes(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .trim();
}

/** Also strips punctuation except apostrophes. */
export function normalizeLoose(s: string): string {
  return fixQuotes(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Correct answer, for the feedback panel and done screen. */
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

/** Identifies the exercise on the done screen. */
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

/** The user's answer, for display. */
export function answerText(ex: Exercise, value: AnswerValue): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(" ");
  if (ex.type === "matching" && isPairMap(value)) {
    return ex.pairs.map((p) => `${p.left} → ${value[p.left] ?? "?"}`).join(", ");
  }
  return JSON.stringify(value);
}

/** Complete enough to enable Check. */
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
      return isPairMap(value) && ex.pairs.every((p) => typeof value[p.left] === "string");
  }
}

/** Returns null when the exercise needs the AI. */
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
      if (!isPairMap(value)) return { correct: false, correctAnswer };
      // Wrong pairs bounce back while playing, so a finished board is correct.
      return { correct: ex.pairs.every((p) => value[p.left] === p.right), correctAnswer };
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
