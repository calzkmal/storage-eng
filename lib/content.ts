import fs from "node:fs";
import path from "node:path";
import { unstable_cache, revalidateTag } from "next/cache";
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
 * Reads go through Next's data cache under one tag, because every round trip
 * to Supabase costs 50-90ms and lessons change only when someone regenerates
 * or resets a set. Those writes call `invalidateLessons()`, which drops the
 * tag, so a change is visible on the very next request.
 *
 * Only import this from server components, route handlers, or scripts.
 */

export const LESSONS_DIR = path.join(process.cwd(), "content", "lessons");

const LESSONS_TAG = "lessons";
/**
 * Safety net only: the tag is dropped explicitly on every write. It also
 * bounds staleness in `next dev`, where tag invalidation does not reach
 * `unstable_cache` (it does in a production build, which is verified).
 */
const CACHE_TTL_SECONDS = 60;

export type SetSource = "seed" | "generated";

/** Enough to render a lesson card, without loading any exercises. */
export type LessonOverview = {
  id: string;
  category: number;
  order: number;
  title: string;
  exerciseCount: number;
  setId: string;
  setVersion: number;
  setSource: SetSource;
};

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

function fileOverview(lesson: Lesson): LessonOverview {
  return {
    id: lesson.id,
    category: lesson.category,
    order: lesson.order,
    title: lesson.title,
    exerciseCount: lesson.exercises.length,
    setId: fileSetId(lesson.id),
    setVersion: 1,
    setSource: "seed",
  };
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

type OverviewRow = {
  id: string;
  category: number;
  position: number;
  title: string;
  active_set_id: string | null;
  set_version: number | null;
  set_source: SetSource | null;
  exercise_count: number | null;
};

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

const OVERVIEW_COLUMNS = "id, category, position, title, active_set_id, set_version, set_source, exercise_count";

/**
 * Drop the cached reads. Called after every write; `revalidateTag` only works
 * inside a request, so the seed script (which has none) is tolerated.
 */
export function invalidateLessons(): void {
  try {
    // `{ expire: 0 }`, not "max": "max" is stale-while-revalidate, which would
    // let the page that just regenerated a set still render the old one. This
    // makes the next read a blocking cache miss, so a write is visible at once.
    revalidateTag(LESSONS_TAG, { expire: 0 });
  } catch {
    /* no request context, e.g. the seed script: the TTL covers it */
  }
}

function fail(step: string, error: { message: string } | null): never {
  throw new Error(`[content] ${step}: ${error?.message ?? "unknown error"}`);
}

/**
 * Make sure one lesson exists in the database with its seed set.
 * With `force`, the seed set's exercises are overwritten from the JSON file.
 */
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

// ---------------------------------------------------------------------------
// Cached reads
// ---------------------------------------------------------------------------

/** One small query against the view: no exercises cross the wire. */
const readOverviews = unstable_cache(
  async (): Promise<LessonOverview[] | null> => {
    const db = getDb();
    if (!db) return null;

    let { data, error } = await db
      .from("lesson_overview")
      .select(OVERVIEW_COLUMNS)
      .order("category", { ascending: true })
      .order("position", { ascending: true });
    if (error) fail("read lesson overviews", error);

    if (!data || data.length === 0) {
      // First run against an empty database: load the bundled lessons.
      await seedDatabase(false);
      ({ data, error } = await db
        .from("lesson_overview")
        .select(OVERVIEW_COLUMNS)
        .order("category", { ascending: true })
        .order("position", { ascending: true }));
      if (error) fail("read lesson overviews after seeding", error);
    }

    const files = new Map(loadLessonFiles().map((l) => [l.id, l]));
    return (data ?? [])
      .map((r) => r as unknown as OverviewRow)
      .map((r) => {
        // A lesson with no active set falls back to its bundled file.
        if (!r.active_set_id || r.exercise_count == null) {
          const file = files.get(r.id);
          return file ? fileOverview(file) : null;
        }
        return {
          id: r.id,
          category: r.category,
          order: r.position,
          title: r.title,
          exerciseCount: r.exercise_count,
          setId: r.active_set_id,
          setVersion: r.set_version ?? 1,
          setSource: r.set_source ?? "seed",
        } satisfies LessonOverview;
      })
      .filter((x): x is LessonOverview => x !== null);
  },
  ["lesson-overviews"],
  { tags: [LESSONS_TAG], revalidate: CACHE_TTL_SECONDS },
);

/** Two small queries for exactly one lesson, instead of loading the whole syllabus. */
const readLesson = unstable_cache(
  async (id: string): Promise<LessonWithSet | null> => {
    const db = getDb();
    if (!db) return null;

    const { data: row, error } = await db
      .from("lessons")
      .select("id, category, position, title, intro, active_set_id")
      .eq("id", id)
      .maybeSingle();
    if (error) fail(`read lesson ${id}`, error);
    if (!row) return null;

    const lessonRow = row as LessonRow;
    if (!lessonRow.active_set_id) return null;

    const { data: setRow, error: setErr } = await db
      .from("exercise_sets")
      .select("id, lesson_id, version, source, model_used, exercises")
      .eq("id", lessonRow.active_set_id)
      .maybeSingle();
    if (setErr) fail(`read active set for ${id}`, setErr);
    if (!setRow) return null;

    const set = setRow as SetRow;
    const exercises = ExercisesJson.safeParse(set.exercises);
    if (!exercises.success) {
      console.error(`[content] stored set ${set.id} for ${id} is invalid; using the bundled file instead`);
      return null;
    }
    const parsed = LessonSchema.safeParse({
      id: lessonRow.id,
      category: lessonRow.category,
      order: lessonRow.position,
      title: lessonRow.title,
      intro: lessonRow.intro ?? undefined,
      exercises: exercises.data,
    });
    if (!parsed.success) {
      console.error(`[content] stored lesson ${id} is invalid; using the bundled file instead`);
      return null;
    }
    return {
      ...parsed.data,
      setId: set.id,
      setVersion: set.version,
      setSource: set.source,
      modelUsed: set.model_used,
    };
  },
  ["lesson-by-id"],
  { tags: [LESSONS_TAG], revalidate: CACHE_TTL_SECONDS },
);

/** Every lesson with its exercises. Only the grading route needs this much. */
const readAllLessons = unstable_cache(
  async (): Promise<LessonWithSet[] | null> => {
    const overviews = await readOverviews();
    if (!overviews) return null;
    const lessons = await Promise.all(overviews.map((o) => readLesson(o.id)));
    return lessons.filter((l): l is LessonWithSet => l !== null);
  },
  ["all-lessons"],
  { tags: [LESSONS_TAG], revalidate: CACHE_TTL_SECONDS },
);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Lesson cards for the home page. Falls back to the bundled files. */
export async function getLessonOverviews(): Promise<LessonOverview[]> {
  try {
    const rows = await readOverviews();
    if (rows && rows.length) return rows;
  } catch (err) {
    console.error("[content] database unavailable, using bundled files:", err instanceof Error ? err.message : err);
  }
  return loadLessonFiles().map(fileOverview);
}

/** One lesson with its exercises. Falls back to the bundled file. */
export async function getLesson(id: string): Promise<LessonWithSet | undefined> {
  try {
    const lesson = await readLesson(id);
    if (lesson) return lesson;
  } catch (err) {
    console.error("[content] database unavailable, using bundled files:", err instanceof Error ? err.message : err);
  }
  const file = loadLessonFiles().find((l) => l.id === id);
  return file ? withFileSet(file) : undefined;
}

export async function findExercise(exerciseId: string): Promise<Exercise | undefined> {
  let lessons: LessonWithSet[] | null = null;
  try {
    lessons = await readAllLessons();
  } catch (err) {
    console.error("[content] database unavailable, using bundled files:", err instanceof Error ? err.message : err);
  }
  const all = lessons?.length ? lessons : loadLessonFiles().map(withFileSet);
  for (const lesson of all) {
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
