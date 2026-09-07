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

function overviewOf(lesson: LessonWithSet): LessonOverview {
  return {
    id: lesson.id,
    category: lesson.category,
    order: lesson.order,
    title: lesson.title,
    exerciseCount: lesson.exercises.length,
    setId: lesson.setId,
    setVersion: lesson.setVersion,
    setSource: lesson.setSource,
  };
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

/** A row of the `lesson_active` view: a lesson joined to the set it is using. */
type ActiveRow = {
  id: string;
  category: number;
  position: number;
  title: string;
  intro: string | null;
  set_id: string;
  set_version: number;
  set_source: SetSource;
  model_used: string | null;
  exercises: unknown;
};

const ExercisesJson = z.array(ExerciseSchema);

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

/**
 * The whole syllabus in ONE query, cached under one tag.
 *
 * Opening a lesson used to run two sequential queries and had its own cache
 * key per lesson, so each lesson opened for the first time paid both. These
 * queries are latency-bound rather than payload-bound (reading all 18 sets
 * with their exercises measured the same as reading one), so loading
 * everything at once and caching it makes every lesson after the first free.
 */
const readSyllabus = unstable_cache(
  async (): Promise<LessonWithSet[] | null> => {
    const db = getDb();
    if (!db) return null;

    const query = () =>
      db
        .from("lesson_active")
        .select("id, category, position, title, intro, set_id, set_version, set_source, model_used, exercises")
        .order("category", { ascending: true })
        .order("position", { ascending: true });

    let { data, error } = await query();
    if (error) fail("read syllabus", error);

    if (!data || data.length === 0) {
      // First run against an empty database: load the bundled lessons.
      await seedDatabase(false);
      ({ data, error } = await query());
      if (error) fail("read syllabus after seeding", error);
    }

    const out: LessonWithSet[] = [];
    for (const raw of data ?? []) {
      const row = raw as unknown as ActiveRow;
      const exercises = ExercisesJson.safeParse(row.exercises);
      const parsed = exercises.success
        ? LessonSchema.safeParse({
            id: row.id,
            category: row.category,
            order: row.position,
            title: row.title,
            intro: row.intro ?? undefined,
            exercises: exercises.data,
          })
        : null;
      if (!parsed?.success) {
        console.error(`[content] stored set ${row.set_id} for ${row.id} is invalid; using the bundled file instead`);
        continue;
      }
      out.push({
        ...parsed.data,
        setId: row.set_id,
        setVersion: row.set_version,
        setSource: row.set_source,
        modelUsed: row.model_used,
      });
    }
    out.sort((a, b) => a.category - b.category || a.order - b.order);
    return out;
  },
  ["syllabus"],
  { tags: [LESSONS_TAG], revalidate: CACHE_TTL_SECONDS },
);

/** The syllabus, falling back to the bundled files when the database is out. */
async function syllabus(): Promise<LessonWithSet[]> {
  try {
    const rows = await readSyllabus();
    if (rows && rows.length) return rows;
  } catch (err) {
    console.error("[content] database unavailable, using bundled files:", err instanceof Error ? err.message : err);
  }
  return loadLessonFiles().map(withFileSet);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Lesson cards for the home page. */
export async function getLessonOverviews(): Promise<LessonOverview[]> {
  return (await syllabus()).map(overviewOf);
}

/** One lesson with its exercises. */
export async function getLesson(id: string): Promise<LessonWithSet | undefined> {
  return (await syllabus()).find((l) => l.id === id);
}

export async function findExercise(exerciseId: string): Promise<Exercise | undefined> {
  for (const lesson of await syllabus()) {
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
