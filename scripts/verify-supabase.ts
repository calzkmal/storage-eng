// Opt-in live integration check. Seeds only TKA and removes only its own QA profiles.
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { rowsFingerprint } from "../lib/contentFingerprint";
import { getDb } from "../lib/db";
import { loadLessonFiles, seedDatabase } from "../lib/content";
import { loadTkaSets } from "../lib/tkaSets";
import { attemptContext } from "../lib/attemptContext";
import { answerText, correctAnswerText, exerciseSummary, gradeLocal, type AnswerValue } from "../lib/grading";

async function main() {
  assert(process.argv.includes("--allow-writes"), "Explicit --allow-writes required: seeds TKA and creates/deletes QA profiles on configured Supabase.");
  const configured = getDb();
  assert(configured, "Supabase environment required");
  const db: SupabaseClient = configured;
  async function rows(table: string, order: string) {
    const all: Record<string, unknown>[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db!.from(table).select("*").order(order).range(from, from + 999);
      assert.ifError(error);
      all.push(...data);
      if (data.length < 1000) return all;
    }
  }
  const hash = rowsFingerprint;
  const oldLessons = (await rows("lessons", "id")).filter(l => l.subject === "english");
  const oldSets = await rows("exercise_sets", "id");
  const oldCompletions = await rows("learner_sets", "learner_id");
  const oldAttempts = await rows("attempts", "id");
  for (let pass = 1; pass <= 2; pass++) {
    for (const subject of ["matematika", "bahasa-indonesia"] as const) {
      const result = await seedDatabase(false, subject);
      if (pass === 2) assert.equal(result.createdSets, 0);
      console.log({ pass, subject, ...result });
    }
  }
  const lessons = await rows("lessons", "id");
  const sets = await rows("exercise_sets", "id");
  assert.equal(hash(lessons.filter(l => l.subject === "english")), hash(oldLessons), "English lesson rows changed");
  assert.equal(hash(sets.filter(s => oldSets.some(old => old.id === s.id))), hash(oldSets), "Existing set rows changed");
  assert.deepEqual(new Set(sets.map(s => s.id)).size, sets.length);
  assert.equal(hash(await rows("learner_sets", "learner_id")), hash(oldCompletions), "Existing completion rows changed");
  assert.equal(hash(await rows("attempts", "id")), hash(oldAttempts), "Existing attempt rows changed");
  const files = loadLessonFiles().filter(l => l.subject !== "english");
  for (const table of ["lesson_active", "lesson_sets"]) {
    const { data, error } = await db.from(table).select("*").neq("subject", "english");
    assert.ifError(error);
    assert.equal(data!.length, files.length * (table === "lesson_sets" ? 3 : 1));
    for (const lesson of files) {
      const row: Record<string, unknown> | undefined = data!.find((r: Record<string, unknown>) => (r.lesson_id ?? r.id) === lesson.id && (r.version ?? r.set_version) === 1);
      assert(row);
      for (const field of ["level", "objectives", "material", "stimuli"] as const) assert.deepEqual(row[field], lesson[field] ?? null);
      assert.deepEqual(row.exercises, lesson.exercises);
      assert.equal(sets.filter(s => s.lesson_id === lesson.id && s.source === "seed").length, 1);
    }
  }
  console.log({ preservation: "passed", englishLessons: oldLessons.length, existingSets: oldSets.length, completions: oldCompletions.length, attempts: oldAttempts.length, tkaLessons: files.length, tkaExercises: files.flatMap(l => [l.exercises, ...loadTkaSets(l)].flat()).length });
  const base = process.env.LOCAL_BASE_URL;
  if (!base) return;
  assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname), "API checks require localhost");
  const cookies: string[] = [];
  const ids: string[] = [];
  async function request(path: string, cookie = "", body?: unknown, method?: string) {
    const response = await fetch(base + path, { method: method ?? (body === undefined ? "GET" : "POST"), headers: { "Content-Type": "application/json", Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
    const value = await response.json();
    assert.equal(response.status, 200, `${path}: ${JSON.stringify(value)}`);
    return { response, value };
  }
  try {
    for (let i = 0; i < 2; i++) {
      const { response, value } = await request("/api/learner", "", { name: `TKA integration QA ${randomUUID().slice(0, 8)}` });
      assert.equal(value.stored, true);
      const cookie = response.headers.get("set-cookie")!.split(";")[0];
      assert(cookie.includes("ep_learner="));
      cookies.push(cookie);
      ids.push(cookie.split("=")[1].split(".")[0]);
    }
    for (const lesson of [loadLessonFiles().find(l => l.subject === "english")!, files.find(l => l.id === "tka-math-bangun-ruang")!, files.find(l => l.id === "tka-bi-fakta-opini")!]) {
      const runId = randomUUID();
      const exercises = lesson.subject === "english" ? lesson.exercises.filter(e => e.type === "multiple_choice").slice(0, 1) : lesson.exercises.filter(e => ["multiple_choice", "multiple_select", "statement_category"].includes(e.type)).filter((e, i, a) => a.findIndex(x => x.type === e.type) === i);
      for (const ex of exercises) {
        assert(ex.type === "multiple_choice" || ex.type === "multiple_select" || ex.type === "statement_category");
        const answer: AnswerValue = ex.type === "statement_category" ? Object.fromEntries(ex.statements.map(s => [s.id, s.answer])) : ex.answer;
        const context = attemptContext(lesson, ex, gradeLocal(ex, answer)?.details);
        for (const phase of ["main", "review"]) {
          const { value } = await request("/api/attempts", cookies[0], { runId, lessonId: lesson.id, lessonTitle: lesson.title, subject: lesson.subject, competency: ex.competency, setId: sets.find(s => s.lesson_id === lesson.id && s.source === "seed")!.id, exerciseId: ex.id, exerciseType: ex.type, phase, question: exerciseSummary(ex), userAnswer: answerText(ex, answer), correctAnswer: correctAnswerText(ex), correct: true, gradedBy: "local", context });
          assert.equal(value.stored, true);
        }
      }
      const { value } = await request("/api/learner/sets", cookies[0], { lessonId: lesson.id, setId: sets.find(s => s.lesson_id === lesson.id && s.source === "seed")!.id });
      assert.equal(value.stored, true);
      const { value: history } = await request(`/api/history?subject=${lesson.subject}`, cookies[0]);
      assert.equal(history.stored, true);
      assert.equal(history.runs.length, 1);
      assert.equal(history.runs[0].subject, lesson.subject);
      assert.equal(history.runs[0].answers.length, exercises.length * 2);
      for (const row of history.runs[0].answers) {
        assert(row.correctAnswer);
        assert(["main", "review"].includes(row.phase));
        if (lesson.subject !== "english") assert.equal(row.context.version, 1);
      }
    }
    assert.equal((await request("/api/history", cookies[0])).value.runs.length, 3);
    assert.deepEqual((await request("/api/history", cookies[1])).value.runs, []);
    assert.deepEqual((await request("/api/history", cookies[0].slice(0, -1) + "!")).value.runs, []);
    // Make TKA older than the 600-row all-subject cap: filtering must precede limit.
    const english = loadLessonFiles().find(l => l.subject === "english")!;
    const bulkRun = randomUUID();
    const { error: bulkError } = await db.from("attempts").insert(Array.from({ length: 601 }, (_, index) => ({ learner_id: ids[0], run_id: bulkRun, lesson_id: english.id, lesson_title: english.title, exercise_id: `qa-limit-${index}`, exercise_type: "multiple_choice", phase: "main", question: "QA limit probe", user_answer: "QA", correct_answer: "QA", correct: true, graded_by: "local" })));
    assert.ifError(bulkError);
    const { value: filtered } = await request("/api/history?subject=matematika", cookies[0]);
    assert.equal(filtered.runs.length, 1);
    assert.equal(filtered.runs[0].answers.length, 6);
    const { value: capped } = await request("/api/history", cookies[0]);
    assert.equal(capped.runs.flatMap((r: { answers: unknown[] }) => r.answers).length, 600);
    assert(capped.runs.every((r: { subject: string }) => r.subject === "english"));
    await request("/api/learner", cookies[0], {}, "DELETE");
    for (const table of ["learners", "attempts", "learner_sets"]) {
      const { count, error } = await db.from(table).select("*", { count: "exact", head: true }).eq(table === "learners" ? "id" : "learner_id", ids[0]);
      assert.ifError(error); assert.equal(count, 0);
    }
    console.log("Live API checks passed: 14 main/review attempts, 3 completions, snapshots, subject history, cookie isolation, filter-before-600-limit, legacy English default, and profile deletion (601 temporary cap probes).");
  } finally {
    for (const cookie of cookies) await request("/api/learner", cookie, {}, "DELETE");
  }
  assert.equal(hash(await rows("learner_sets", "learner_id")), hash(oldCompletions));
  assert.equal(hash(await rows("attempts", "id")), hash(oldAttempts));
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Verification failed"); process.exitCode = 1; });
