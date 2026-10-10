// Additive: never delete, replace, or reactivate existing sets.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { getDb } from "../lib/db";
import { loadLessonFiles, seedDatabase } from "../lib/content";
import { loadTkaSets } from "../lib/tkaSets";
async function main() {
  const configured = getDb(); assert(configured, "Supabase environment required");
  const db: SupabaseClient = configured;
  const lessons = loadLessonFiles().filter(l => l.subject !== "english");
  async function snapshot(table: string, order: string) {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.from(table).select("*").order(order).range(offset, offset + 999);
      assert.ifError(error); rows.push(...data!);
      if (data!.length < 1000) return rows;
    }
  }
  const hash = (rows: Record<string, unknown>[]) => createHash("sha256").update(JSON.stringify(rows.map(r => JSON.stringify(r)).sort())).digest("hex");
  const oldSets = await snapshot("exercise_sets", "id");
  const oldLessons = await snapshot("lessons", "id");
  const oldCompletions = await snapshot("learner_sets", "learner_id");
  const oldAttempts = await snapshot("attempts", "id");
  // Preflight every file before the first write.
  for (const lesson of lessons) assert.equal(loadTkaSets(lesson).length, 2, `${lesson.id}: missing sets`);
  // Reject occupied versions or changed content; keep existing IDs and completions.
  for (const lesson of lessons) {
    const { data, error } = await db.from("exercise_sets").select("version,source,exercises").eq("lesson_id", lesson.id);
    assert.ifError(error);
    const planned = [lesson.exercises, ...loadTkaSets(lesson)];
    for (const row of data ?? []) if (row.version <= 3) {
      assert.equal(row.source, row.version === 1 ? "seed" : "variation");
      assert.deepEqual(row.exercises, planned[row.version - 1], `${lesson.id}: existing v${row.version} differs; refusing overwrite`);
    }
  }
  for (const subject of ["matematika", "bahasa-indonesia"] as const) await seedDatabase(false, subject);
  let created = 0;
  for (const lesson of lessons) for (const [i, exercises] of loadTkaSets(lesson).entries()) {
    const version = i + 2;
    const { data, error } = await db.from("exercise_sets").select("id").eq("lesson_id", lesson.id).eq("version", version).maybeSingle();
    assert.ifError(error);
    if (!data) {
      const { error: insertError } = await db.from("exercise_sets").insert({ lesson_id: lesson.id, version, source: "variation", exercises, model_used: null });
      assert.ifError(insertError); created++;
    }
  }
  const afterSets = await snapshot("exercise_sets", "id");
  const afterLessons = await snapshot("lessons", "id");
  assert.equal(hash(afterSets.filter(r => oldSets.some(old => old.id === r.id))), hash(oldSets), "Existing sets changed");
  assert.equal(hash(afterLessons.filter(r => oldLessons.some(old => old.id === r.id))), hash(oldLessons), "Existing lesson rows changed");
  assert.equal(hash(await snapshot("learner_sets", "learner_id")), hash(oldCompletions), "Existing completions changed");
  assert.equal(hash(await snapshot("attempts", "id")), hash(oldAttempts), "Existing attempts changed");
  for (const lesson of lessons) {
    const stored = afterSets.filter(r => r.lesson_id === lesson.id);
    for (const [index, exercises] of [lesson.exercises, ...loadTkaSets(lesson)].entries()) assert.deepEqual(stored.find(r => r.version === index + 1)?.exercises, exercises, `${lesson.id}: stored v${index + 1} missing or mismatched`);
  }
  console.log(`Preservation passed: ${oldSets.length} existing sets, ${oldLessons.length} lessons, ${oldCompletions.length} completions, ${oldAttempts.length} attempts unchanged.`);
  console.log(`TKA bank: ${lessons.length} topics, ${lessons.length * 3} sets; ${created} supplemental sets created. Existing sets preserved.`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Seed failed"); process.exitCode = 1; });
