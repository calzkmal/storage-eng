import fs from "node:fs";
import path from "node:path";
import { LessonSchema, type Exercise, type Lesson } from "./schema";

/**
 * Server-side loader for /content/lessons/*.json.
 * Only import this from server components, route handlers, or scripts.
 */

export const LESSONS_DIR = path.join(process.cwd(), "content", "lessons");

let cached: Lesson[] | null = null;

export function loadLessons(): Lesson[] {
  if (cached && process.env.NODE_ENV === "production") return cached;

  const files = fs
    .readdirSync(LESSONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const lessons = files.map((file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(LESSONS_DIR, file), "utf8"));
    const parsed = LessonSchema.safeParse(raw);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      throw new Error(`Invalid lesson file ${file}:\n${details}`);
    }
    return parsed.data;
  });

  lessons.sort((a, b) => a.order - b.order);
  cached = lessons;
  return lessons;
}

export function getLesson(id: string): Lesson | undefined {
  return loadLessons().find((l) => l.id === id);
}

export function findExercise(exerciseId: string): Exercise | undefined {
  for (const lesson of loadLessons()) {
    const ex = lesson.exercises.find((e) => e.id === exerciseId);
    if (ex) return ex;
  }
  return undefined;
}
