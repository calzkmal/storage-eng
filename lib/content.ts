import fs from "node:fs";
import path from "node:path";
import { unstable_cache, revalidateTag } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ExerciseSchema, LessonSchema, type Exercise, type Lesson } from "./schema";
import { getDb, isDbConfigured } from "./db";

// Question storage. Supabase is the source of truth; the JSON files seed it
// and are the fallback when it is unreachable. Server-side only.

export const LESSONS_DIR = path.join(process.cwd(), "content", "lessons");

const LESSONS_TAG = "lessons";
// Backstop for `next dev`, where tag invalidation does not reach unstable_cache.
const CACHE_TTL_SECONDS = 60;

export type SetSource = "seed" | "generated" | "variation";

/** A lesson card, without its exercises. */
export type LessonOverview = {
  id: string;
  category: number;
  order: number;
  title: string;
  exerciseCount: number;
  /** Ids of every set, so a card can show how many the learner has finished. */
  setIds: string[];
};

/** One playable set of questions for a lesson. */
export type LessonSet = { setId: string; version: number; source: SetSource; exercises: Exercise[] };

/** A lesson plus every set a learner can be given. */
export type LessonWithSets = Lesson & { sets: LessonSet[] };

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

function withFileSet(lesson: Lesson): LessonWithSets {
  return {
    ...lesson,
    sets: [{ setId: fileSetId(lesson.id), version: 1, source: "seed", exercises: lesson.exercises }],
  };
}

function overviewOf(lesson: LessonWithSets): LessonOverview {
  return {
    id: lesson.id,
    category: lesson.category,
    order: lesson.order,
    title: lesson.title,
    exerciseCount: lesson.sets[0]?.exercises.length ?? 0,
    setIds: lesson.sets.map((s) => s.setId),
  };
}

/** Row of the `lesson_sets` view: one playable set joined to its lesson. */
type SetRow = {
  set_id: string;
  lesson_id: string;
  version: number;
  source: SetSource;
  exercises: unknown;
  category: number;
  position: number;
  title: string;
  intro: string | null;
};

const ExercisesJson = z.array(ExerciseSchema);

/** Drop the cached reads. Called after every write. */
export function invalidateLessons(): void {
  try {
    // Not "max": that is stale-while-revalidate and would serve the old set once more.
    revalidateTag(LESSONS_TAG, { expire: 0 });
  } catch {
    // No request context, e.g. the seed script.
  }
}

function fail(step: string, error: { message: string } | null): never {
  throw new Error(`[content] ${step}: ${error?.message ?? "unknown error"}`);
}

/** Ensure the lesson and its seed set exist. `force` re-syncs exercises from the file. */
export async function seedLesson(
  db: SupabaseClient,
  lesson: Lesson,
  force = false,
): Promise<{ seedSetId: string; created: boolean }> {
  const { error: upErr } = await db.from("lessons").upsert(
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
export async function seedDatabase(
  force = false,
): Promise<{ lessons: number; createdSets: number; removed: number }> {
  const db = getDb();
  if (!db) throw new Error("Database not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  let createdSets = 0;
  const files = loadLessonFiles();
  for (const lesson of files) {
    const r = await seedLesson(db, lesson, force);
    if (r.created) createdSets++;
  }

  // Drop lessons whose file is gone. Attempts keep their own lesson title, so history survives.
  // Filtered here rather than in a hand-built PostgREST expression, which an id
  // containing a comma or bracket would corrupt.
  const keep = new Set(files.map((l) => l.id));
  const { data: existing, error } = await db.from("lessons").select("id");
  if (error) fail("find stale lessons", error);
  const removed = (existing ?? []).map((r) => (r as { id: string }).id).filter((id) => !keep.has(id));
  if (removed.length) {
    const { error: delErr } = await db.from("lessons").delete().in("id", removed);
    if (delErr) fail("delete stale lessons", delErr);
    console.log(`[content] removed lessons no longer in the syllabus: ${removed.join(", ")}`);
  }

  invalidateLessons();
  return { lessons: files.length, createdSets, removed: removed.length };
}

// One query for every playable set. These reads are latency-bound rather than
// payload-bound, so fetching the whole syllabus at once and caching it is cheapest.
const readSyllabus = unstable_cache(
  async (): Promise<LessonWithSets[] | null> => {
    const db = getDb();
    if (!db) return null;

    const query = () =>
      db
        .from("lesson_sets")
        .select("set_id, lesson_id, version, source, exercises, category, position, title, intro")
        .order("category", { ascending: true })
        .order("position", { ascending: true })
        .order("version", { ascending: true });

    let { data, error } = await query();
    if (error) fail("read syllabus", error);

    if (!data || data.length === 0) {
      // Empty database: load the bundled lessons.
      await seedDatabase(false);
      ({ data, error } = await query());
      if (error) fail("read syllabus after seeding", error);
    }

    const byLesson = new Map<string, LessonWithSets>();
    for (const raw of data ?? []) {
      const row = raw as unknown as SetRow;
      const exercises = ExercisesJson.safeParse(row.exercises);
      if (!exercises.success) {
        console.error(`[content] stored set ${row.set_id} for ${row.lesson_id} is invalid; skipped`);
        continue;
      }
      const parsed = LessonSchema.safeParse({
        id: row.lesson_id,
        category: row.category,
        order: row.position,
        title: row.title,
        intro: row.intro ?? undefined,
        exercises: exercises.data,
      });
      if (!parsed.success) {
        console.error(`[content] stored set ${row.set_id} for ${row.lesson_id} is invalid; skipped`);
        continue;
      }
      const set = { setId: row.set_id, version: row.version, source: row.source, exercises: exercises.data };
      const existing = byLesson.get(row.lesson_id);
      if (existing) existing.sets.push(set);
      else byLesson.set(row.lesson_id, { ...parsed.data, sets: [set] });
    }

    const out = [...byLesson.values()];
    out.sort((a, b) => a.category - b.category || a.order - b.order);
    return out;
  },
  ["syllabus"],
  { tags: [LESSONS_TAG], revalidate: CACHE_TTL_SECONDS },
);

/** Falls back to the bundled files when the database is out. */
async function syllabus(): Promise<LessonWithSets[]> {
  try {
    const rows = await readSyllabus();
    if (rows && rows.length) return rows;
  } catch (err) {
    console.error("[content] database unavailable, using bundled files:", err instanceof Error ? err.message : err);
  }
  return loadLessonFiles().map(withFileSet);
}

/** Lesson cards for the home page. */
export async function getLessonOverviews(): Promise<LessonOverview[]> {
  return (await syllabus()).map(overviewOf);
}

/** One lesson with its exercises. */
export async function getLesson(id: string): Promise<LessonWithSets | undefined> {
  return (await syllabus()).find((l) => l.id === id);
}

export async function findExercise(exerciseId: string): Promise<Exercise | undefined> {
  for (const lesson of await syllabus()) {
    for (const set of lesson.sets) {
      const ex = set.exercises.find((e) => e.id === exerciseId);
      if (ex) return ex;
    }
  }
  return undefined;
}

export { isDbConfigured };

/** Store a generated set as the next version and activate it. */
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

/** Activate the seed set again. Generated sets are kept. */
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
