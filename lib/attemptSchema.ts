import { z } from "zod";
import { SubjectSchema } from "./schema";
import { AttemptContextSchema } from "./attemptContext";
import { COMPETENCIES } from "./subjects";
// Exercise telemetry is client-reported, not an authoritative exam score.
export const AttemptBodySchema = z.object({
  subject: SubjectSchema.default("english"),
  competency: z.string().max(100).optional(),
  context: AttemptContextSchema.optional(),
  runId: z.string().min(8).max(64),
  lessonId: z.string().min(1).max(100),
  lessonTitle: z.string().min(1).max(200),
  setId: z.string().max(100).nullable().optional(),
  exerciseId: z.string().min(1).max(100),
  exerciseType: z.string().min(1).max(40),
  phase: z.enum(["main", "review"]),
  question: z.string().max(600),
  userAnswer: z.string().max(600),
  correctAnswer: z.string().max(600),
  correct: z.boolean().nullable(),
  gradedBy: z.enum(["local", "ai", "cache", "fallback"]),
}).superRefine((a, ctx) => {
  if (a.subject === "english") {
    if (a.context || a.competency || ["multiple_select", "statement_category"].includes(a.exerciseType)) ctx.addIssue({ code: "custom", message: "invalid English context" });
  } else {
    if (!a.competency || COMPETENCIES[a.competency]?.subject !== a.subject || !a.context || a.gradedBy !== "local" || a.correct === null || !["multiple_choice", "multiple_select", "statement_category"].includes(a.exerciseType)) ctx.addIssue({ code: "custom", message: "invalid TKA attempt" });
    if (a.subject === "bahasa-indonesia" && (!a.context?.stimulus || !a.context.evidence?.length || a.context.evidence.some(q => !a.context!.stimulus!.paragraphs.join("\n").includes(q)))) ctx.addIssue({ code: "custom", message: "invalid BI evidence" });
    if (["multiple_select", "statement_category"].includes(a.exerciseType) && !a.context?.details?.length) ctx.addIssue({ code: "custom", message: "missing feedback details" });
  }
});

