import { z } from "zod";
import { StimulusSchema, FractionSchema, type Lesson, type Exercise } from "./schema";
import type { GradeDetail } from "./grading";
export const AttemptContextSchema = z.object({
  version: z.literal(1),
  stimulus: StimulusSchema.optional(),
  evidence: z.array(z.string().min(1).max(2000)).max(8).optional(),
  visual: FractionSchema.optional(),
  explanation: z.string().min(1).max(4000),
  details: z.array(z.object({ label: z.string().min(1).max(600), result: z.enum(["tepat", "terlewat", "keliru", "tidak dipilih"]), explanation: z.string().min(1).max(2000) })).max(5).optional(),
}).strict().refine(v => new TextEncoder().encode(JSON.stringify(v)).length <= 16384, "context exceeds 16 KiB");
export type AttemptContext = z.infer<typeof AttemptContextSchema>;
export function attemptContext(lesson: Lesson, ex: Exercise, details?: GradeDetail[]): AttemptContext | undefined {
  if (lesson.subject === "english") return undefined;
  return AttemptContextSchema.parse({ version: 1, stimulus: lesson.stimuli?.find(s => s.id === ex.stimulusId), evidence: ex.evidence, visual: ex.visual, explanation: ex.explanation, details });
}
