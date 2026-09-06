import { chatCompletion, OpenRouterError, type ChatMessage } from "./openrouter";
import { getModels } from "./models";
import { LessonSchema, type Exercise, type ExerciseType, type Lesson } from "../schema";

/**
 * Exercise generator (spec §7.4). Asks the free-model list for a complete new
 * set of exercises for one lesson, following the same type plan as the current
 * file, then validates the result against the content schema. Nothing here
 * writes to disk; saving is a separate, human-triggered step.
 */

const CALL_TIMEOUT_MS = 90_000;
const MAX_ATTEMPTS = 3;

const LESSON_FOCUS: Record<string, string> = {
  "l1-present-simple":
    "Present simple for general truths (facts that are always true) and daily routines/habits. Mix both kinds of sentences.",
  "l2-verb-endings":
    "He/she/it verb endings: add -s (loves, looks), add -es after -sh/-ch/-x/-o/-ss (watches, goes, fixes), consonant + y becomes -ies (studies, carries). Vowel + y just adds -s (plays).",
  "l3-adverbs-frequency":
    "Adverbs of frequency: always, usually, often, sometimes, never. Position: before the main verb, but after am/is/are.",
  "l4-negative":
    "Negative present simple with don't (I/you/we/they) and doesn't (he/she/it) + base verb. After doesn't the verb loses its -s.",
  "l5-past-simple":
    "Past simple: regular verbs add -ed (watched, studied). Irregular verbs are ONLY these six: go→went, eat→ate, have→had, see→saw, do→did, write→wrote. Do not use any other irregular verb anywhere in the lesson (no slept, took, made, came, etc.).",
  "l6-future": "Future with will and won't + base verb. Will never changes for he/she/it.",
};

const SYSTEM_PROMPT = `You write grammar exercises for absolute-beginner English learners in Indonesia.
Only cover these grammar points: present simple (general truth + routine), he/she/it endings -s/-es/-ies, adverbs of frequency (always, usually, often, sometimes, never), negatives with don't/doesn't + base verb, past simple (regular -ed and ONLY the irregulars went, ate, had, saw, did, wrote), future with will/won't + base verb.
Never use: present continuous, questions with do/does inversion, "going to", perfect tenses, or any other irregular past verb.
Use short, everyday sentences (family, food, school, weather, hobbies). Indonesian places and foods are welcome (Jakarta, nasi goreng).

Field rules:
- "prompt" is a short English instruction shown above the exercise, e.g. "Choose the correct form".
- All exercise content (question, sentence, options, words, pairs, source, task, modelAnswer) is in English.
- "explanation" is in Indonesian (Bahasa Indonesia), at most 2 short sentences, friendly, and names the specific rule. Keep English grammar terms and example words in English. Never use an em dash.
- multiple_choice: 3 or 4 options, exactly one correct, and "answer" must be copied exactly from "options". Wrong options must be believable beginner mistakes.
- fill_blank: "sentence" contains exactly one "___" followed by the base verb in brackets, e.g. "She ___ (carry) her bag." or "He ___ (not / be) late.". Each "answer" entry is the COMPLETE text that replaces "___" so the sentence reads correctly (e.g. "carries", "will eat", "doesn't like"), never just a helper word like "will".
- word_order: "answer" is the correct sentence without a final period; "words" is that same sentence split into words in a scrambled order (4 to 7 words).
- matching: 4 or 5 pairs; every "left" must be unique.
- flip_sentence: "source" is a present simple sentence; "target" is given; "answer" lists accepted rewrites (include both contracted and full forms when relevant, e.g. "doesn't" and "does not").
- free_write: "task" is a one-sentence writing task, "requirements" lists the grammar points to check, "modelAnswer" is one good example sentence.

Respond with JSON only, no markdown, matching exactly: {"exercises": [ ... ]}`;

const TYPE_SHAPES: Record<ExerciseType, string> = {
  multiple_choice:
    '{"type":"multiple_choice","prompt":"...","question":"She ___ English every day.","options":["study","studies","studys"],"answer":"studies","explanation":"..."}',
  fill_blank: '{"type":"fill_blank","prompt":"...","sentence":"He ___ (fix) computers.","answer":["fixes"],"explanation":"..."}',
  word_order:
    '{"type":"word_order","prompt":"...","words":["always","I","eat","breakfast"],"answer":"I always eat breakfast","explanation":"..."}',
  matching:
    '{"type":"matching","prompt":"...","pairs":[{"left":"go","right":"went"},{"left":"eat","right":"ate"},{"left":"see","right":"saw"},{"left":"do","right":"did"}],"explanation":"..."}',
  flip_sentence:
    '{"type":"flip_sentence","prompt":"...","source":"He writes poems.","target":"negative","answer":["He doesn\'t write poems.","He does not write poems."],"explanation":"..."}',
  free_write:
    '{"type":"free_write","prompt":"...","task":"Write one sentence about tomorrow.","requirements":["future with will"],"modelAnswer":"Tomorrow I will visit my grandmother.","explanation":"..."}',
};

const ID_ABBR: Record<ExerciseType, string> = {
  multiple_choice: "mc",
  fill_blank: "fb",
  word_order: "wo",
  matching: "match",
  flip_sentence: "flip",
  free_write: "fw",
};

export type PlanItem = { type: ExerciseType; target?: "negative" | "past" | "future" };

/** The type sequence of the current lesson; the new set follows the same plan. */
export function planFromLesson(lesson: Lesson): PlanItem[] {
  return lesson.exercises.map((ex) =>
    ex.type === "flip_sentence" ? { type: ex.type, target: ex.target } : { type: ex.type },
  );
}

function buildUserMessage(lesson: Lesson, plan: PlanItem[]): string {
  const focus = LESSON_FOCUS[lesson.id] ?? lesson.intro ?? lesson.title;
  const planLines = plan
    .map((p, i) => `${i + 1}. ${p.type}${p.target ? ` (target: ${p.target})` : ""}`)
    .join("\n");
  const shapes = [...new Set(plan.map((p) => p.type))].map((t) => TYPE_SHAPES[t]).join("\n");
  const current = lesson.exercises
    .map((ex) => {
      switch (ex.type) {
        case "multiple_choice":
          return `- ${ex.question} → ${ex.answer}`;
        case "fill_blank":
          return `- ${ex.sentence} → ${ex.answer[0]}`;
        case "word_order":
          return `- ${ex.answer}`;
        case "matching":
          return `- ${ex.pairs.map((p) => `${p.left}/${p.right}`).join(", ")}`;
        case "flip_sentence":
          return `- ${ex.source} → ${ex.answer[0]}`;
        case "free_write":
          return `- ${ex.task}`;
      }
    })
    .join("\n");

  return `Lesson: ${lesson.title}
This lesson practises ONLY this grammar point: ${focus}
Every single exercise must test exactly this point. Do not bring in other tenses or topics (no past forms, no will, no negatives, no adverbs of frequency) unless they ARE this lesson's focus. Sentences in matching pairs must also be about this focus.

Write exactly ${plan.length} NEW exercises, in this order and with these types:
${planLines}

JSON shape for each type:
${shapes}

The current exercises are listed below only to show the level and format. Write different sentences; do not reuse these:
${current}`;
}

const REPAIR_NUDGE = (problems: string[]) =>
  `Your previous answer had these problems:\n${problems.map((p) => `- ${p}`).join("\n")}\nReturn the full corrected set as JSON only, no markdown, matching exactly {"exercises": [ ... ]}.`;

function extractJson(raw: string): unknown {
  let text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const objStart = text.indexOf("{");
  const arrStart = text.indexOf("[");
  const start = objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
  if (start === -1) throw new Error("no JSON found in model output");
  const endChar = text[start] === "{" ? "}" : "]";
  const end = text.lastIndexOf(endChar);
  text = text.slice(start, end + 1);
  return JSON.parse(text);
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

const wordsOf = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .split(/\s+/)
    .filter(Boolean);

/**
 * Light normalisation of what the model returned before schema validation:
 * assign ids, trim strings, fix an answer that differs from an option only by case,
 * and rebuild `words` from `answer` when they disagree.
 */
function normalizeGenerated(lessonId: string, plan: PlanItem[], raw: unknown): { exercises: unknown[]; problems: string[] } {
  const problems: string[] = [];
  const list = isRecord(raw) && Array.isArray(raw.exercises) ? raw.exercises : Array.isArray(raw) ? raw : null;
  if (!list) return { exercises: [], problems: ['output must be {"exercises": [...]}'] };
  if (list.length !== plan.length) problems.push(`expected ${plan.length} exercises, got ${list.length}`);

  const counters: Partial<Record<ExerciseType, number>> = {};
  const batchTag = Math.random().toString(36).slice(2, 8);
  const exercises = list.map((item, i) => {
    if (!isRecord(item)) {
      problems.push(`exercise ${i + 1} is not an object`);
      return item;
    }
    const ex: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(item)) ex[k] = typeof v === "string" ? v.trim() : v;

    const type = ex.type as ExerciseType;
    const planned = plan[i];
    if (planned && type !== planned.type) problems.push(`exercise ${i + 1} should be ${planned.type}, got ${String(type)}`);
    if (planned?.target && ex.target !== planned.target) ex.target = planned.target;

    // Ids must not collide with the built-in files (the grade route looks
    // exercises up by id) nor with earlier generations (the grade cache is keyed by id).
    const abbr = ID_ABBR[type] ?? "ex";
    counters[type] = (counters[type] ?? 0) + 1;
    ex.id = `${lessonId}-gen-${abbr}-${counters[type]}-${batchTag}`;
    if (typeof ex.prompt !== "string" || !ex.prompt) ex.prompt = defaultPrompt(type);

    if (type === "multiple_choice" && Array.isArray(ex.options) && typeof ex.answer === "string") {
      const opts = ex.options.map((o) => (typeof o === "string" ? o.trim() : o));
      ex.options = opts;
      if (!opts.includes(ex.answer)) {
        const ci = opts.find((o) => typeof o === "string" && o.toLowerCase() === (ex.answer as string).toLowerCase());
        if (ci) ex.answer = ci;
      }
    }
    if (type === "word_order" && typeof ex.answer === "string") {
      ex.answer = ex.answer.replace(/[.!?]+$/, "").trim();
      const fromAnswer = (ex.answer as string).split(/\s+/);
      const given = Array.isArray(ex.words) ? ex.words.map(String) : [];
      const same = wordsOf(given.join(" ")).sort().join(" ") === wordsOf(fromAnswer.join(" ")).sort().join(" ");
      if (!same) ex.words = fromAnswer;
    }
    if (type === "fill_blank" && typeof ex.answer === "string") ex.answer = [ex.answer];
    if (type === "flip_sentence" && typeof ex.answer === "string") ex.answer = [ex.answer];
    if (type === "free_write" && typeof ex.requirements === "string") ex.requirements = [ex.requirements];
    if (typeof ex.explanation === "string" && ex.explanation.includes("—")) {
      ex.explanation = ex.explanation.replace(/\s*—\s*/g, ", ");
    }
    return ex;
  });

  return { exercises, problems };
}

function defaultPrompt(type: ExerciseType): string {
  switch (type) {
    case "multiple_choice":
      return "Choose the correct form";
    case "fill_blank":
      return "Complete the sentence with the correct form";
    case "word_order":
      return "Put the words in the correct order";
    case "matching":
      return "Match the pairs";
    case "flip_sentence":
      return "Rewrite the sentence";
    case "free_write":
      return "Write your own sentence";
  }
}

/** Validate a candidate exercise list as a full lesson. Returns problems (empty when valid). */
export function validateCandidate(lesson: Lesson, exercises: unknown[]): { lesson?: Lesson; problems: string[] } {
  const parsed = LessonSchema.safeParse({ ...lesson, exercises });
  if (parsed.success) return { lesson: parsed.data, problems: [] };
  return {
    problems: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

export type GenerateOutcome =
  | { ok: true; exercises: Exercise[]; modelUsed: string; attempts: number }
  | { ok: false; error: string; modelUsed: string; attempts: number; problems?: string[] };

export async function generateLessonExercises(lesson: Lesson): Promise<GenerateOutcome> {
  const plan = planFromLesson(lesson);
  const models = getModels();
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserMessage(lesson, plan) },
  ];

  let modelUsed = "none";
  let lastProblems: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let content: string;
    try {
      const res = await chatCompletion(messages, {
        models,
        timeoutMs: CALL_TIMEOUT_MS,
        temperature: 0.8,
        maxTokens: 4000,
      });
      content = res.content;
      modelUsed = res.model;
    } catch (err) {
      const reason = err instanceof OpenRouterError ? `${err.kind}: ${err.message}` : String(err);
      return { ok: false, error: reason, modelUsed, attempts: attempt };
    }

    let problems: string[] = [];
    try {
      const raw = extractJson(content);
      const norm = normalizeGenerated(lesson.id, plan, raw);
      problems = norm.problems;
      if (!problems.length) {
        const v = validateCandidate(lesson, norm.exercises);
        if (v.lesson) return { ok: true, exercises: v.lesson.exercises, modelUsed, attempts: attempt };
        problems = v.problems;
      }
    } catch (err) {
      problems = [`invalid JSON: ${err instanceof Error ? err.message : String(err)}`];
    }

    lastProblems = problems;
    console.log(
      `[ai/generate] lesson=${lesson.id} attempt=${attempt} model=${modelUsed} problems=${problems.length}` +
        (problems[0] ? ` first="${problems[0].slice(0, 120)}"` : ""),
    );
    messages.push({ role: "assistant", content }, { role: "user", content: REPAIR_NUDGE(problems.slice(0, 12)) });
  }

  return {
    ok: false,
    error: `Model output failed validation after ${MAX_ATTEMPTS} attempts`,
    modelUsed,
    attempts: MAX_ATTEMPTS,
    problems: lastProblems,
  };
}
