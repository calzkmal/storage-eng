// Additive: never delete, replace, or reactivate existing sets.
import type { SupabaseClient } from "@supabase/supabase-js";
import { assessmentFingerprint, rowsFingerprint } from "../lib/contentFingerprint";
import assert from "node:assert/strict";
import { getDb } from "../lib/db";
import { loadLessonFiles, seedDatabase } from "../lib/content";
import { loadTkaSets } from "../lib/tkaSets";
async function main() {
  const configured = getDb(); assert(configured, "Supabase environment required");
  const db: SupabaseClient = configured;
  const syncStimuli = process.argv.includes("--sync-stimuli");
  const syncFeedback = process.argv.includes("--sync-feedback");
  const syncMaterial = process.argv.includes("--sync-material");
  const lessons = loadLessonFiles().filter(l => l.subject !== "english");
  async function snapshot(table: string, order: string) {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.from(table).select("*").order(order).range(offset, offset + 999);
      assert.ifError(error); rows.push(...data!);
      if (data!.length < 1000) return rows;
    }
  }
  const hash = rowsFingerprint;
  const oldSets = await snapshot("exercise_sets", "id");
  const oldLessons = await snapshot("lessons", "id");
  const oldCompletions = await snapshot("learner_sets", "learner_id");
  const oldAttempts = await snapshot("attempts", "id");
  const expectedOldLessons = oldLessons.map(row => {
    const lesson = lessons.find(l => l.id === row.id);
    if (!lesson) return row;
    const planned = { id: lesson.id, category: lesson.category, position: lesson.order, title: lesson.title, intro: lesson.intro ?? null, subject: lesson.subject, level: lesson.level ?? null, objectives: lesson.objectives ?? null, material: lesson.material ?? null, stimuli: lesson.stimuli ?? null };
    for (const [field, value] of Object.entries(planned)) {
      if (syncMaterial && ["objectives", "material"].includes(field)) continue;
      if (syncStimuli && field === "stimuli") {
        assert.deepEqual((row.stimuli as { id: string }[] | null)?.map(s => s.id), lesson.stimuli?.map(s => s.id) ?? undefined, `${lesson.id}: stimulus IDs changed`);
        continue;
      }
      assert.deepEqual(row[field], value, `${lesson.id}: ${field} differs; refusing metadata overwrite`);
    }
    return { ...row, ...(syncMaterial ? { objectives: planned.objectives, material: planned.material } : {}), ...(syncStimuli ? { stimuli: planned.stimuli } : {}) };
  });
  // Preflight every file before the first write.
  for (const lesson of lessons) assert.equal(loadTkaSets(lesson).length, 2, `${lesson.id}: missing sets`);
  // Reject occupied versions or changed content; keep existing IDs and completions.
  for (const lesson of lessons) {
    const { data, error } = await db.from("exercise_sets").select("version,source,exercises").eq("lesson_id", lesson.id);
    assert.ifError(error);
    const planned = [lesson.exercises, ...loadTkaSets(lesson)];
    for (const row of data ?? []) if (row.version <= 3) {
      assert.equal(row.source, row.version === 1 ? "seed" : "variation");
      if (syncFeedback) assert.equal(assessmentFingerprint(row.exercises), assessmentFingerprint(planned[row.version - 1]), `${lesson.id}: assessment differs; refusing feedback-only update`);
      else assert.deepEqual(row.exercises, planned[row.version - 1], `${lesson.id}: existing v${row.version} differs; refusing overwrite`);
    }
  }
  for (const subject of ["matematika", "bahasa-indonesia"] as const) await seedDatabase(false, subject);
  let created = 0, feedbackUpdated = 0;
  for (const lesson of lessons) for (const [i, exercises] of [lesson.exercises, ...loadTkaSets(lesson)].entries()) {
    const version = i + 1;
    const { data, error } = await db.from("exercise_sets").select("id,exercises").eq("lesson_id", lesson.id).eq("version", version).maybeSingle();
    assert.ifError(error);
    if (data && syncFeedback && hash([data.exercises]) !== hash([exercises])) {
      const { error: updateError } = await db.from("exercise_sets").update({ exercises }).eq("id", data.id);
      assert.ifError(updateError); feedbackUpdated++;
    }
    if (!data) {
      const { error: insertError } = await db.from("exercise_sets").insert({ lesson_id: lesson.id, version, source: "variation", exercises, model_used: null });
      assert.ifError(insertError); created++;
    }
  }
  const afterSets = await snapshot("exercise_sets", "id");
  const afterLessons = await snapshot("lessons", "id");
  assert.equal(hash(afterSets.filter(r => oldSets.some(old => old.id === r.id))), hash(oldSets.map(row => {
    const lesson = lessons.find(l => l.id === row.lesson_id);
    return syncFeedback && lesson && Number(row.version) <= 3 ? { ...row, exercises: [lesson.exercises, ...loadTkaSets(lesson)][Number(row.version) - 1] } : row;
  })), "Unexpected existing set changes");
  assert.equal(hash(afterLessons.filter(r => oldLessons.some(old => old.id === r.id))), hash(expectedOldLessons), "Unexpected existing lesson row changes");
  assert.equal(hash(await snapshot("learner_sets", "learner_id")), hash(oldCompletions), "Existing completions changed");
  assert.equal(hash(await snapshot("attempts", "id")), hash(oldAttempts), "Existing attempts changed");
  for (const lesson of lessons) {
    const stored = afterSets.filter(r => r.lesson_id === lesson.id);
    for (const [index, exercises] of [lesson.exercises, ...loadTkaSets(lesson)].entries()) assert.deepEqual(stored.find(r => r.version === index + 1)?.exercises, exercises, `${lesson.id}: stored v${index + 1} missing or mismatched`);
  }
  console.log(`Preservation passed: ${oldSets.length} existing sets${feedbackUpdated ? ` (${feedbackUpdated} approved feedback revisions)` : ""}, ${oldLessons.length} lessons${syncMaterial ? " (material/objectives explicitly synchronized)" : ""}${syncStimuli ? " (stimuli text explicitly synchronized)" : ""}, ${oldCompletions.length} completions, ${oldAttempts.length} attempts unchanged.`);
  console.log(`TKA bank: ${lessons.length} topics, ${lessons.length * 3} sets; ${created} supplemental sets created. Existing identities preserved; ${feedbackUpdated} feedback-only updates.`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Seed failed"); process.exitCode = 1; });
