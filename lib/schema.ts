import { z } from "zod";

/**
 * Content schema for lessons (spec §5).
 * Both the runtime loader and scripts/validate-content.ts use this file.
 */

const BaseSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  explanation: z.string().min(1),
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
  target: z.enum(["negative", "past", "future"]),
  answer: z.array(z.string().min(1)).min(1),
});

export const FreeWriteSchema = BaseSchema.extend({
  type: z.literal("free_write"),
  task: z.string().min(1),
  requirements: z.array(z.string().min(1)).min(1),
  modelAnswer: z.string().min(1),
});

export const ExerciseSchema = z.discriminatedUnion("type", [
  MultipleChoiceSchema,
  FillBlankSchema,
  WordOrderSchema,
  MatchingSchema,
  FlipSentenceSchema,
  FreeWriteSchema,
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
    order: z.number().int().positive(),
    title: z.string().min(1),
    intro: z.string().optional(),
    exercises: z.array(ExerciseSchema).min(1),
  })
  .superRefine((lesson, ctx) => {
    const seen = new Set<string>();
    lesson.exercises.forEach((ex, i) => {
      const at = (field: string) => ["exercises", i, field];
      if (seen.has(ex.id)) {
        ctx.addIssue({ code: "custom", path: at("id"), message: `duplicate exercise id "${ex.id}"` });
      }
      seen.add(ex.id);

      switch (ex.type) {
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
