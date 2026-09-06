/**
 * Validate every lesson file in /content/lessons against the schema (spec §5).
 * Runs in `prebuild`; exits non-zero on any error.
 *
 *   npm run validate
 */
import fs from "node:fs";
import path from "node:path";
import { LessonSchema, type ExerciseType } from "../lib/schema";

const dir = path.join(process.cwd(), "content", "lessons");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

let errors = 0;
const ids = new Set<string>();
const orders = new Set<number>();
const exerciseIds = new Set<string>();
const typesSeen = new Set<ExerciseType>();

for (const file of files) {
  const raw = fs.readFileSync(path.join(dir, file), "utf8");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error(`✗ ${file}: invalid JSON (${(e as Error).message})`);
    errors++;
    continue;
  }

  const result = LessonSchema.safeParse(json);
  if (!result.success) {
    console.error(`✗ ${file}`);
    for (const issue of result.error.issues) {
      console.error(`    ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      errors++;
    }
    continue;
  }

  const lesson = result.data;
  const problems: string[] = [];

  if (ids.has(lesson.id)) problems.push(`duplicate lesson id "${lesson.id}"`);
  ids.add(lesson.id);
  if (orders.has(lesson.order)) problems.push(`duplicate lesson order ${lesson.order}`);
  orders.add(lesson.order);
  if (file !== `${lesson.id}.json`) problems.push(`file name should be ${lesson.id}.json`);

  const n = lesson.exercises.length;
  if (n < 8 || n > 10) problems.push(`has ${n} exercises; spec §8 asks for 8–10`);

  const aiCount = lesson.exercises.filter((e) => e.type === "free_write" || e.type === "flip_sentence").length;
  const freeWrites = lesson.exercises.filter((e) => e.type === "free_write").length;
  if (freeWrites > 1) problems.push(`has ${freeWrites} free_write exercises; spec §6 allows at most 1`);
  if (aiCount > 3) problems.push(`has ${aiCount} AI-graded exercises; spec §6 targets ≤3`);

  for (const ex of lesson.exercises) {
    typesSeen.add(ex.type);
    if (exerciseIds.has(ex.id)) problems.push(`exercise id "${ex.id}" is used in another lesson`);
    exerciseIds.add(ex.id);
    if (/placeholder|todo|tbd|lorem/i.test(ex.explanation)) problems.push(`exercise "${ex.id}" has placeholder explanation`);
    if (ex.explanation.includes("—")) problems.push(`exercise "${ex.id}" explanation contains an em dash`);
  }
  if (lesson.intro?.includes("—")) problems.push("intro contains an em dash");

  if (problems.length) {
    console.error(`✗ ${file}`);
    for (const p of problems) console.error(`    ${p}`);
    errors += problems.length;
  } else {
    console.log(`✓ ${file}  (${n} exercises, ${aiCount} AI-graded)`);
  }
}

const allTypes: ExerciseType[] = ["multiple_choice", "fill_blank", "word_order", "matching", "flip_sentence", "free_write"];
const missing = allTypes.filter((t) => !typesSeen.has(t));
if (missing.length) {
  console.error(`✗ exercise types never used: ${missing.join(", ")}`);
  errors += missing.length;
}

if (errors) {
  console.error(`\n${errors} problem(s) found in ${files.length} lesson file(s).`);
  process.exit(1);
}
console.log(`\nAll ${files.length} lesson files are valid.`);
