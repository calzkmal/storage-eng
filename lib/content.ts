import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ExerciseSchema, LessonSchema, type Exercise, type Lesson } from "./schema";
import { getDb, isDbConfigured } from "./db";

/**
 * Server-side question storage.
 *
 * Source of truth is Supabase (tables `lessons` and `exercise_sets`, see
 * supabase/migrations). The JSON files in /content/lessons are the seed
 * content: they are loaded into the database on first use, and they are also
 * the fallback whenever the database is not configured or unreachable, so the
 * app never renders empty.
 *
 * Only import this from server components, route handlers, or scripts.
 */

export const LESSONS_DIR = path.join(process.cwd(), "content", "lessons");

export type SetSource = "seed" | "generated";

/** A lesson together with the identity of the exercise set it is currently using. */
export type LessonWithSet = Lesson & {
  setId: string;
  setVersion: number;
  setSource: SetSource;
  modelUsed: string | null;
};

// ---------------------------------------------------------------------------
// Bundled JSON files (seed + fallback)
// ---------------------------------------------------------------------------

let fileCache: Lesson[] | null = null;

export function loadLessonFiles(): Lesson[] {
  if (fileCache && process.env.NODE_ENV === "production") return fileCache;

  const files = fs
    .readdirSync(LESSONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const lessons = files.map((file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(LESSONS_DIR, file), "utf8"));
    const parsed = LessonSchema.safeParse(raw);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
      throw new Error(`Invalid lesson file ${file}:\n${details}`);
    }
    return parsed.data;
  });

  lessons.sort((a, b) => a.category - b.category || a.order - b.order);
  fileCache = lessons;
  return lessons;
}

const fileSetId = (lessonId: string) => `file:${lessonId}`;

function withFileSet(lesson: Lesson): LessonWithSet {
  return { ...lesson, setId: fileSetId(lesson.id), setVersion: 1, setSource: "seed", modelUsed: null };
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

type LessonRow = {
  id: string;
  category: number;
  position: number;
  title: string;
  intro: string | null;
  active_set_id: string | null;
};
type SetRow = {
  id: string;
  lesson_id: string;
  version: number;
  source: SetSource;
  model_used: string | null;
  exercises: unknown;
};

const ExercisesJson = z.array(ExerciseSchema);

const DB_CACHE_MS = 5000;
let dbCache: { at: number; lessons: LessonWithSet[] } | null = null;

/** Drop the short in-memory cache (called after every write). */
export function invalidateLessons(): void {
  dbCache = null;
}

function fail(step: string, error: { message: string } | null): never {
  throw new Error(`[content] ${step}: ${error?.message ?? "unknown error"}`);
}

/**
 * Make sure one lesson exists in the database with its seed set.
 * With `force`, the seed set's exercises are overwritten from the JSON file.
 */
export async function seedLesson(db: SupabaseClient, lesson: Lesson, force = false): Promise<{ seedSetId: string; created: boolean }> {
  const { error: upErr } = await db
    .from("lessons")
    .upsert(
      {
        id: lesson.id,
        category: lesson.category,
        position: lesson.order,
        title: lesson.title,
        intro: lesson.intro ?? null,
      },
      { onConflict: "id" },
    );
  if (upErr) fail(`upsert lesson ${lesson.id}`, upErr);

  const { data: existing, error: selErr } = await db
    .from("exercise_sets")
    .select("id")
    .eq("lesson_id", lesson.id)
    .eq("source", "seed")
    .order("version", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (selErr) fail(`read seed set ${lesson.id}`, selErr);

  let seedSetId: string;
  let created = false;
  if (existing) {
    seedSetId = (existing as { id: string }).id;
    if (force) {
      const { error } = await db.from("exercise_sets").update({ exercises: lesson.exercises }).eq("id", seedSetId);
      if (error) fail(`update seed set ${lesson.id}`, error);
    }
  } else {
    const { data: inserted, error } = await db
      .from("exercise_sets")
      .insert({ lesson_id: lesson.id, version: 1, source: "seed", model_used: null, exercises: lesson.exercises })
      .select("id")
      .single();
    if (error || !inserted) fail(`insert seed set ${lesson.id}`, error);
    seedSetId = (inserted as { id: string }).id;
    created = true;
  }

  // Activate the seed set if the lesson has no active set yet.
  const { data: row, error: rowErr } = await db.from("lessons").select("active_set_id").eq("id", lesson.id).single();
  if (rowErr) fail(`read lesson ${lesson.id}`, rowErr);
  if (!(row as { active_set_id: string | null }).active_set_id) {
    const { error } = await db.from("lessons").update({ active_set_id: seedSetId }).eq("id", lesson.id);
    if (error) fail(`activate seed set ${lesson.id}`, error);
  }

  invalidateLessons();
  return { seedSetId, created };
}

/** Load every JSON lesson into the database. Idempotent; `force` re-syncs seed exercises. */
export async function seedDatabase(force = false): Promise<{ lessons: number; createdSets: number; removed: number }> {
  const db = getDb();
  if (!db) throw new Error("Database not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  let createdSets = 0;
  const files = loadLessonFiles();
  for (const lesson of files) {
    const r = await seedLesson(db, lesson, force);
    if (r.created) createdSets++;
  }

  // Drop lessons that no longer have a file, so a restructured syllabus does
  // not leave orphans on the home page. Their sets go with them; recorded
  // attempts keep their own copy of the lesson title, so history survives.
  const keep = files.map((l) => l.id);
  const { data: stale, error } = await db.from("lessons").select("id").not("id", "in", `(${keep.join(",")})`);
  if (error) fail("find stale lessons", error);
  const removed = (stale ?? []).map((r) => (r as { id: string }).id);
  if (removed.length) {
    const { error: delErr } = await db.from("lessons").delete().in("id", removed);
    if (delErr) fail("delete stale lessons", delErr);
    console.log(`[content] removed lessons no longer in the syllabus: ${removed.join(", ")}`);
  }

  invalidateLessons();
  return { lessons: files.length, createdSets, removed: removed.length };
}

async function readLessonsFromDb(db: SupabaseClient): Promise<LessonWithSet[]> {
  let { data: rows, error } = await db
    .from("lessons")
    .select("id, category, position, title, intro, active_set_id")
    .order("category", { ascending: true })
    .order("position", { ascending: true });
  if (error) fail("read lessons", error);

  if (!rows || rows.length === 0) {
    // First run against an empty database: load the bundled lessons.
    await seedDatabase(false);
    ({ data: rows, error } = await db
      .from("lessons")
      .select("id, category, position, title, intro, active_set_id")
      .order("category", { ascending: true })
      .order("position", { ascending: true }));
    if (error) fail("read lessons after seeding", error);
  }

  const lessonRows = (rows ?? []) as LessonRow[];
  const activeIds = lessonRows.map((r) => r.active_set_id).filter((x): x is string => Boolean(x));
  let sets: SetRow[] = [];
  if (activeIds.length) {
    const { data, error: setErr } = await db
      .from("exercise_sets")
      .select("id, lesson_id, version, source, model_used, exercises")
      .in("id", activeIds);
    if (setErr) fail("read active sets", setErr);
    sets = (data ?? []) as SetRow[];
  }

  const files = new Map(loadLessonFiles().map((l) => [l.id, l]));
  const out: LessonWithSet[] = [];

  for (const row of lessonRows) {
    const set = sets.find((s) => s.id === row.active_set_id);
    const file = files.get(row.id);

    if (set) {
      const exercises = ExercisesJson.safeParse(set.exercises);
      const lesson = exercises.success
        ? LessonSchema.safeParse({
            id: row.id,
            category: row.category,
            order: row.position,
            title: row.title,
            intro: row.intro ?? undefined,
            exercises: exercises.data,
          })
        : null;
      if (lesson?.success) {
        out.push({
          ...lesson.data,
          setId: set.id,
          setVersion: set.version,
          setSource: set.source,
          modelUsed: set.model_used,
        });
        continue;
      }
      console.error(`[content] stored set ${set.id} for ${row.id} is invalid; using the bundled file instead`);
    }

    if (file) out.push(withFileSet(file));
  }

  out.sort((a, b) => a.category - b.category || a.order - b.order);
  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getLessons(): Promise<LessonWithSet[]> {
  const db = getDb();
  if (!db) return loadLessonFiles().map(withFileSet);

  if (dbCache && Date.now() - dbCache.at < DB_CACHE_MS) return dbCache.lessons;
  try {
    const lessons = await readLessonsFromDb(db);
    dbCache = { at: Date.now(), lessons };
    return lessons;
  } catch (err) {
    console.error("[content] database unavailable, using bundled files:", err instanceof Error ? err.message : err);
    return loadLessonFiles().map(withFileSet);
  }
}

export async function getLesson(id: string): Promise<LessonWithSet | undefined> {
  return (await getLessons()).find((l) => l.id === id);
}

export async function findExercise(exerciseId: string): Promise<Exercise | undefined> {
  for (const lesson of await getLessons()) {
    const ex = lesson.exercises.find((e) => e.id === exerciseId);
    if (ex) return ex;
  }
  return undefined;
}

export { isDbConfigured };

/** Store a freshly generated set as the next version and make it the lesson's active set. */
export async function saveGeneratedSet(
  lessonId: string,
  exercises: Exercise[],
  modelUsed: string,
): Promise<{ setId: string; version: number }> {
  const db = getDb();
  if (!db) throw new Error("Database not configured");

  const file = loadLessonFiles().find((l) => l.id === lessonId);
  if (file) await seedLesson(db, file, false);

  const { data: latest, error: e1 } = await db
    .from("exercise_sets")
    .select("version")
    .eq("lesson_id", lessonId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (e1) fail(`read latest version ${lessonId}`, e1);
  const version = ((latest as { version: number } | null)?.version ?? 0) + 1;

  const { data: inserted, error: e2 } = await db
    .from("exercise_sets")
    .insert({ lesson_id: lessonId, version, source: "generated", model_used: modelUsed, exercises })
    .select("id")
    .single();
  if (e2 || !inserted) fail(`insert generated set ${lessonId}`, e2);
  const setId = (inserted as { id: string }).id;

  const { error: e3 } = await db
    .from("lessons")
    .update({ active_set_id: setId, updated_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (e3) fail(`activate set ${lessonId}`, e3);

  invalidateLessons();
  return { setId, version };
}

/** Point the lesson back at its seeded original set. Generated sets are kept. */
export async function resetLessonToSeed(lessonId: string): Promise<{ setId: string }> {
  const db = getDb();
  if (!db) throw new Error("Database not configured");

  const file = loadLessonFiles().find((l) => l.id === lessonId);
  if (!file) throw new Error(`Unknown lesson ${lessonId}`);
  const { seedSetId } = await seedLesson(db, file, false);

  const { error } = await db
    .from("lessons")
    .update({ active_set_id: seedSetId, updated_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (error) fail(`reset ${lessonId}`, error);

  invalidateLessons();
  return { setId: seedSetId };
}
