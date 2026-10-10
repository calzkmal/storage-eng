import type { Exercise } from "./schema";

/** Answer value produced by each exercise component. */
export type AnswerValue =
  | string // multiple_choice, fill_blank, flip_sentence, free_write
  | string[] // word_order: placed words in order
  | Record<string, string>; // matching: left text -> right text

function isPairMap(v: AnswerValue | null): v is Record<string, string> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export type GradeDetail = { label: string; result: "tepat" | "terlewat" | "keliru" | "tidak dipilih"; explanation: string };
export type LocalGrade = { correct: boolean; correctAnswer: string; details?: GradeDetail[] };

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
    case "multiple_select":
      return ex.options.filter(o => ex.answer.includes(o.id)).map(o => o.text).join("; ");
    case "statement_category":
      return ex.statements.map(s => `${s.text} → ${ex.categories.find(c => c.id === s.answer)?.label}`).join("; ");
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
    case "multiple_select":
    case "statement_category":
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
  if (ex.type === "multiple_select" && Array.isArray(value)) return value.map(id => ex.options.find(o => o.id === id)?.text ?? `[${id}]`).join("; ");
  if (ex.type === "statement_category" && isPairMap(value)) return ex.statements.map(s => `${s.text} → ${ex.categories.find(c => c.id === value[s.id])?.label ?? "?"}`).join("; ");
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
    case "multiple_select":
      return Array.isArray(value) && value.length > 0 && new Set(value).size === value.length && value.every(id => ex.options.some(o => o.id === id));
    case "statement_category":
      return isPairMap(value) && Object.keys(value).length === ex.statements.length && ex.statements.every(s => ex.categories.some(c => c.id === value[s.id]));
    case "multiple_choice":
      return typeof value === "string" && ex.options.includes(value);
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
    case "multiple_select": {
      const selected = Array.isArray(value) ? value : [];
      const correct = canCheck(ex, value) && selected.length === ex.answer.length && ex.answer.every(id => selected.includes(id));
      const details: GradeDetail[] = ex.options.map(o => ({ label: o.text, explanation: o.explanation,
        result: ex.answer.includes(o.id) ? (selected.includes(o.id) ? "tepat" : "terlewat") : (selected.includes(o.id) ? "keliru" : "tidak dipilih") }));
      return { correct, correctAnswer, details };
    }
    case "statement_category": {
      const chosen = isPairMap(value) ? value : {};
      const details: GradeDetail[] = ex.statements.map(s => ({ label: `${s.text} → ${ex.categories.find(c => c.id === s.answer)?.label}`, explanation: s.explanation, result: chosen[s.id] === s.answer ? "tepat" : "keliru" }));
      return { correct: canCheck(ex, value) && ex.statements.every(s => chosen[s.id] === s.answer), correctAnswer, details };
    }
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
