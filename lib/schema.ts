import { z } from "zod";
import { COMPETENCIES } from "./subjects";
import { SUBJECT_CATEGORIES } from "./categories";
export const SubjectSchema = z.enum(["english", "matematika", "bahasa-indonesia"]);
export const FractionSchema = z.object({
  numerator: z.number().int().min(0), denominator: z.number().int().min(1).max(12),
}).refine(v => v.numerator <= v.denominator, "numerator exceeds denominator");
export const StimulusSchema = z.object({
  id: z.string().min(1).max(100), title: z.string().min(1).max(200),
  paragraphs: z.array(z.string().min(1).max(2000)).min(1).max(8),
  attribution: z.string().max(200).optional(),
});
export const MaterialSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), title: z.string().min(1), text: z.string().min(1) }),
  z.object({ type: z.literal("worked_example"), question: z.string().min(1), steps: z.array(z.string().min(1)).min(1), conclusion: z.string().min(1) }),
  z.object({ type: z.literal("fraction"), visual: FractionSchema }),
]);

/**
 * Content schema for lessons (spec §5).
 * Both the runtime loader and scripts/validate-content.ts use this file.
 */

const BaseSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  explanation: z.string().min(1),
  competency: z.string().optional(),
  stimulusId: z.string().optional(),
  evidence: z.array(z.string().min(1)).optional(),
  visual: FractionSchema.optional(),
});

export const MultipleChoiceSchema = BaseSchema.extend({
  type: z.literal("multiple_choice"),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(4),
  answer: z.string().min(1),
});

export const FillBlankSchema = BaseSchema.extend({
  type: z.literal("fill_blank"),
  sentence: z.string().min(1),
  answer: z.array(z.string().min(1)).min(1),
});

export const WordOrderSchema = BaseSchema.extend({
  type: z.literal("word_order"),
  words: z.array(z.string().min(1)).min(2),
  answer: z.string().min(1),
});

export const MatchingSchema = BaseSchema.extend({
  type: z.literal("matching"),
  pairs: z
    .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
    .min(2)
    .max(6),
});

export const FlipSentenceSchema = BaseSchema.extend({
  type: z.literal("flip_sentence"),
  source: z.string().min(1),
  target: z.enum([
    "negative",
    "present_continuous",
    "present_perfect",
    "past",
    "past_continuous",
    "past_perfect",
    "future",
    "future_continuous",
    "future_perfect",
  ]),
  answer: z.array(z.string().min(1)).min(1),
});

export const FreeWriteSchema = BaseSchema.extend({
  type: z.literal("free_write"),
  task: z.string().min(1),
  requirements: z.array(z.string().min(1)).min(1),
  modelAnswer: z.string().min(1),
});

export const MultipleSelectSchema = BaseSchema.extend({
  type: z.literal("multiple_select"), question: z.string().min(1),
  options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1), explanation: z.string().min(1) })).min(3).max(5),
  answer: z.array(z.string().min(1)).min(2),
});
export const StatementCategorySchema = BaseSchema.extend({
  type: z.literal("statement_category"), question: z.string().min(1),
  categories: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).length(2),
  statements: z.array(z.object({ id: z.string().min(1), text: z.string().min(1), answer: z.string().min(1), explanation: z.string().min(1) })).min(2).max(4),
});
export const ExerciseSchema = z.discriminatedUnion("type", [
  MultipleChoiceSchema,
  FillBlankSchema,
  WordOrderSchema,
  MatchingSchema,
  FlipSentenceSchema,
  FreeWriteSchema,
  MultipleSelectSchema,
  StatementCategorySchema,
]);

const wordsKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");

export const LessonSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, "id must be kebab-case"),
    /** Category number, see lib/categories.ts. With `order` this reads as "1.2". */
    category: z.number().int().positive().max(99),
    /** Position within the category, 1-based. */
    order: z.number().int().positive(),
    subject: SubjectSchema.default("english"),
    level: z.object({ stage: z.literal("sd"), grade: z.literal(6), program: z.literal("tka") }).optional(),
    objectives: z.array(z.string().min(1)).min(1).max(3).optional(),
    material: z.array(MaterialSchema).optional(),
    stimuli: z.array(StimulusSchema).optional(),
    title: z.string().min(1),
    /** Rule paragraph, then one example sentence per line. */
    intro: z.string().optional(),
    exercises: z.array(ExerciseSchema).min(1),
  })
  .superRefine((lesson, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    const unique = (ids: string[], label: string) => { if (new Set(ids).size !== ids.length) issue(`duplicate ${label}`); };
    if (!SUBJECT_CATEGORIES[lesson.subject][lesson.category]) issue("unregistered subject/category");
    unique((lesson.stimuli ?? []).map(s => s.id), "stimulus id");
    const tka = lesson.subject !== "english";
    if (tka) {
      if (!lesson.level || !lesson.objectives || !lesson.material) issue("TKA metadata required");
      const paragraphs = lesson.material?.filter(b => b.type === "paragraph").length ?? 0;
      const examples = lesson.material?.filter(b => b.type === "worked_example").length ?? 0;
      if (paragraphs < 2 || paragraphs > 4 || examples < 2 || examples > 3) issue("TKA requires 2–4 sections and 2–3 examples");
      if (lesson.subject === "matematika" && !lesson.material?.some(b => b.type === "fraction")) issue("fraction visual required");
      if (lesson.exercises.length < 8 || lesson.exercises.length > 10) issue("TKA requires 8–10 exercises");
      for (const type of ["multiple_choice", "multiple_select", "statement_category"]) {
        if (!lesson.exercises.some(e => e.type === type)) issue(`TKA missing ${type}`);
      }
      if (lesson.subject === "bahasa-indonesia" && (!lesson.stimuli || lesson.stimuli.length < 2 || lesson.stimuli.length > 3)) issue("BI requires 2–3 stimuli");
    }
    const seen = new Set<string>();
    lesson.exercises.forEach((ex, i) => {
      const at = (field: string) => ["exercises", i, field];
      if (seen.has(ex.id)) {
        ctx.addIssue({ code: "custom", path: at("id"), message: `duplicate exercise id "${ex.id}"` });
      }
      seen.add(ex.id);

      const stimulus = lesson.stimuli?.find(s => s.id === ex.stimulusId);
      if (ex.stimulusId && !stimulus) issue(`unknown stimulus for ${ex.id}`);
      if (tka) {
        if (!ex.competency || COMPETENCIES[ex.competency]?.subject !== lesson.subject) issue(`unknown competency for ${ex.id}`);
        if (!["multiple_choice", "multiple_select", "statement_category"].includes(ex.type)) issue(`English-only exercise in TKA: ${ex.id}`);
        if (lesson.subject === "bahasa-indonesia") {
          if (!stimulus || !ex.evidence?.length) issue(`BI evidence/stimulus required: ${ex.id}`);
          for (const quote of ex.evidence ?? []) if (!stimulus?.paragraphs.join("\n").includes(quote)) issue(`evidence absent from stimulus: ${ex.id}`);
        }
      }
      switch (ex.type) {
        case "multiple_select": {
          unique(ex.options.map(o => o.id), "option id"); unique(ex.answer, "answer id");
          if (ex.answer.length >= ex.options.length || ex.answer.some(id => !ex.options.some(o => o.id === id))) issue(`invalid multi-select key: ${ex.id}`);
          break;
        }
        case "statement_category": {
          unique(ex.categories.map(c => c.id), "category id"); unique(ex.statements.map(s => s.id), "statement id");
          if (ex.statements.some(s => !ex.categories.some(c => c.id === s.answer))) issue(`invalid statement key: ${ex.id}`);
          break;
        }
        case "multiple_choice":
          if (!ex.options.includes(ex.answer)) {
            ctx.addIssue({ code: "custom", path: at("answer"), message: `answer "${ex.answer}" is not in options` });
          }
          if (new Set(ex.options).size !== ex.options.length) {
            ctx.addIssue({ code: "custom", path: at("options"), message: "options must be unique" });
          }
          break;
        case "fill_blank":
          if (!ex.sentence.includes("___")) {
            ctx.addIssue({ code: "custom", path: at("sentence"), message: 'sentence must contain a "___" blank' });
          }
          break;
        case "word_order":
          if (wordsKey(ex.words.join(" ")) !== wordsKey(ex.answer)) {
            ctx.addIssue({ code: "custom", path: at("answer"), message: "answer must use exactly the words in `words`" });
          }
          break;
        case "matching": {
          const lefts = ex.pairs.map((p) => p.left);
          if (new Set(lefts).size !== lefts.length) {
            ctx.addIssue({ code: "custom", path: at("pairs"), message: "left sides must be unique" });
          }
          break;
        }
        default:
          break;
      }
    });
  });

export type Lesson = z.infer<typeof LessonSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type MultipleChoice = z.infer<typeof MultipleChoiceSchema>;
export type FillBlank = z.infer<typeof FillBlankSchema>;
export type WordOrder = z.infer<typeof WordOrderSchema>;
export type Matching = z.infer<typeof MatchingSchema>;
export type FlipSentence = z.infer<typeof FlipSentenceSchema>;
export type FreeWrite = z.infer<typeof FreeWriteSchema>;
export type ExerciseType = Exercise["type"];

export type MultipleSelect = z.infer<typeof MultipleSelectSchema>;
export type StatementCategory = z.infer<typeof StatementCategorySchema>;
export type Stimulus = z.infer<typeof StimulusSchema>;
