import fs from "node:fs";
import path from "node:path";
import { LessonSchema, type Exercise, type Lesson } from "./schema";
export const TKA_SETS_DIR = path.join(process.cwd(), "content", "tka-sets");
/** Two supplemental sets plus the existing seed; IDs are stable across rebuilds. */
export function loadTkaSets(lesson: Lesson): Exercise[][] {
  if (lesson.subject === "english") return [];
  const filename = path.join(TKA_SETS_DIR, `${lesson.id}.json`);
  if (!fs.existsSync(filename)) return [];
  const raw: unknown = JSON.parse(fs.readFileSync(filename, "utf8"));
  if (!Array.isArray(raw) || raw.length !== 2) throw new Error(`${lesson.id}: expected two supplemental TKA sets`);
  const sets = raw.map(exercises => LessonSchema.parse({ ...lesson, exercises }).exercises);
  const ids = [lesson.exercises, ...sets].flatMap(set => set.map(e => e.id));
  if (new Set(ids).size !== ids.length) throw new Error(`${lesson.id}: repeated exercise IDs across sets`);
  return sets;
}
