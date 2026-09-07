// Pushes content/variations/*.json into exercise_sets as source='variation'.
// Idempotent: a lesson's variations are replaced wholesale on each run.
//
//   npm run seed:variations
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ExerciseSchema } from "../lib/schema";
import { loadLessonFiles, invalidateLessons } from "../lib/content";
import { getDb, isDbConfigured } from "../lib/db";

const DIR = path.join(process.cwd(), "content", "variations");
const Sets = z.array(z.array(ExerciseSchema).min(1));

async function main() {
  if (!isDbConfigured()) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    process.exit(1);
  }
  const db = getDb()!;
  let written = 0;

  for (const lesson of loadLessonFiles()) {
    const file = path.join(DIR, `${lesson.id}.json`);
    if (!fs.existsSync(file)) {
      console.error(`✗ ${lesson.id}: no variations file, run npm run build:variations`);
      process.exit(1);
    }
    const sets = Sets.parse(JSON.parse(fs.readFileSync(file, "utf8")));

    // Replace this lesson's variations so a rebuild never leaves stale ones.
    const { error: delErr } = await db
      .from("exercise_sets")
      .delete()
      .eq("lesson_id", lesson.id)
      .eq("source", "variation");
    if (delErr) throw new Error(`delete ${lesson.id}: ${delErr.message}`);

    // The seed set holds version 1, so variations start at 2.
    const rows = sets.map((exercises, i) => ({
      lesson_id: lesson.id,
      version: i + 2,
      source: "variation" as const,
      model_used: null,
      exercises,
    }));
    const { error } = await db.from("exercise_sets").insert(rows);
    if (error) throw new Error(`insert ${lesson.id}: ${error.message}`);

    written += rows.length;
    console.log(`✓ ${lesson.id.padEnd(28)} ${rows.length} variations`);
  }

  invalidateLessons();
  console.log(`\n${written} variations stored.`);
}

main().catch((err) => {
  console.error("seed-variations failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
