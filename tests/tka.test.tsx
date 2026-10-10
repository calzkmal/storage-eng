import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { loadTkaSets } from "../lib/tkaSets";
import { LessonSchema, FractionSchema, type Exercise, type Lesson } from "../lib/schema";
import { canCheck, gradeLocal, correctAnswerText, answerText } from "../lib/grading";
import { firstScore, shouldRetry } from "../lib/practice";
import { collectionProblems } from "../lib/contentValidation";
import { AttemptBodySchema } from "../lib/attemptSchema";
import { exerciseSummary } from "../lib/grading";
import { AttemptContextSchema, attemptContext } from "../lib/attemptContext";
import { parseResult, getFinished, markFinished, saveResult, loadResultRaw } from "../lib/storage";
import { renderToStaticMarkup } from "react-dom/server";
import StimulusView from "../components/StimulusView";
import FractionVisual from "../components/FractionVisual";
const raw = fs.readdirSync("content/lessons").filter(f => f.endsWith(".json")).map(f => JSON.parse(fs.readFileSync(`content/lessons/${f}`, "utf8")));
const lessons = raw.map(l => LessonSchema.parse(l));
const tka = lessons.filter(l => l.subject !== "english");
const english = lessons.filter(l => l.subject === "english");
const multi = tka[0].exercises.find(e => e.type === "multiple_select")!;
const statement = tka[0].exercises.find(e => e.type === "statement_category")!;
function solution(e: Exercise) {
  switch (e.type) {
    case "multiple_choice": case "word_order": return e.answer;
    case "multiple_select": return [...e.answer].reverse();
    case "statement_category": return Object.fromEntries(e.statements.map(s => [s.id, s.answer]));
    case "matching": return Object.fromEntries(e.pairs.map(p => [p.left, p.right]));
    case "fill_blank": case "flip_sentence": return e.answer[0];
    case "free_write": return e.modelAnswer;
  }
}
test("legacy lessons default to English, original content and six English types survive", () => {
  assert.equal(english.length, 18);
  assert(english.every(l => l.intro && !l.material));
  assert.equal(new Set(english.flatMap(l => l.exercises.map(e => e.type))).size, 6);
  for (const l of english) for (const e of l.exercises) {
    const expected = e.type === "free_write" ? null : true;
    assert.equal(gradeLocal(e, solution(e))?.correct ?? null, expected, e.id);
  }
});
test("subject-qualified slots permit English and Math 1.1 but reject same-subject duplicates", () => {
  assert.deepEqual(collectionProblems(lessons), []);
  const math = tka.find(l => l.subject === "matematika")!;
  assert(collectionProblems([...lessons, { ...math, id: "new-id" }]).some(p => p.includes("duplicate lesson slot")));
  assert(collectionProblems([{ ...math, order: 2 }]).some(p => p.includes("missing")));
});
test("31 TKA topics, 93 sets, 837 deterministic keys, no AI formats", () => {
  assert.equal(tka.length, 31);
  assert.equal(tka.flatMap(l => [l.exercises, ...loadTkaSets(l)].flat()).length, 837);
  for (const l of tka) for (const e of [l.exercises, ...loadTkaSets(l)].flat()) {
    assert(canCheck(e, solution(e)), e.id);
    const grade = gradeLocal(e, solution(e));
    assert.equal(grade?.correct, true, e.id);
    assert(!answerText(e, solution(e)).startsWith("{"));
    assert(correctAnswerText(e).length <= 600, e.id);
    const context = attemptContext(l, e, grade?.details);
    assert(AttemptContextSchema.safeParse(context).success, e.id);
    assert(AttemptBodySchema.safeParse({ subject: l.subject, competency: e.competency, context, runId: "test-run", lessonId: l.id, lessonTitle: l.title, exerciseId: e.id, exerciseType: e.type, phase: "main", question: exerciseSummary(e), userAnswer: answerText(e, solution(e)), correctAnswer: correctAnswerText(e), correct: true, gradedBy: "local" }).success, `${e.id}: invalid telemetry`);
  }
});
test("multi-select is exact unordered set; missing, extra, duplicate, unknown and wrong shapes fail", () => {
  assert.equal(multi.type, "multiple_select"); if (multi.type !== "multiple_select") return;
  assert.equal(gradeLocal(multi, [...multi.answer].reverse())?.correct, true);
  const distractor = multi.options.find(o => !multi.answer.includes(o.id))!.id;
  for (const value of [multi.answer.slice(1), [...multi.answer, distractor], multi.options.map(o => o.id), [...multi.answer, multi.answer[0]], [...multi.answer, "unknown"], "a", {}]) assert.equal(gradeLocal(multi, value)?.correct, false);
  assert.equal(canCheck(multi, ["unknown"]), false);
  const g = gradeLocal(multi, [multi.answer[0], distractor])!;
  assert(g.details?.some(d => d.result === "terlewat")); assert(g.details?.some(d => d.result === "keliru"));
});
test("statement-category needs every valid selection, all correct for a point", () => {
  assert.equal(statement.type, "statement_category"); if (statement.type !== "statement_category") return;
  const correct = Object.fromEntries(statement.statements.map(s => [s.id, s.answer]));
  assert.equal(canCheck(statement, {}), false);
  assert.equal(canCheck(statement, { ...correct, [statement.statements[0].id]: "unknown" }), false);
  const wrong = { ...correct, [statement.statements[0].id]: statement.categories.find(c => c.id !== statement.statements[0].answer)!.id };
  assert.equal(gradeLocal(statement, correct)?.correct, true);
  assert.equal(gradeLocal(statement, wrong)?.correct, false);
  assert.equal(gradeLocal(statement, wrong)?.details?.[0].result, "keliru");
});
test("invalid IDs, stimuli, evidence, visuals, metadata, and AI types rejected", () => {
  const bi = tka.find(l => l.subject === "bahasa-indonesia")!;
  const change = (fn: (l: Lesson) => void) => { const l = structuredClone(bi); fn(l); assert.equal(LessonSchema.safeParse(l).success, false); };
  change(l => { l.exercises[0].stimulusId = "absent"; });
  change(l => { l.exercises[0].evidence = ["not in the text"]; });
  change(l => { l.stimuli!.push(l.stimuli![0]); });
  change(l => { delete l.objectives; });
  change(l => { l.exercises[0].competency = "math.fraction.forms"; });
  change(l => { l.exercises[0] = english[0].exercises.find(e => e.type === "free_write")!; });
  change(l => { const e = l.exercises.find(e => e.type === "multiple_select")!; if (e.type === "multiple_select") e.options[1].id = e.options[0].id; });
  change(l => { const e = l.exercises.find(e => e.type === "multiple_select")!; if (e.type === "multiple_select") e.answer = ["absent", "absent"]; });
  change(l => { const e = l.exercises.find(e => e.type === "statement_category")!; if (e.type === "statement_category") e.statements[0].answer = "absent"; });
  assert.equal(FractionSchema.safeParse({ numerator: 1, denominator: 0 }).success, false);
  assert.equal(FractionSchema.safeParse({ numerator: 5, denominator: 4 }).success, false);
  assert.equal(FractionSchema.safeParse({ numerator: 0.5, denominator: 4 }).success, false);
});
test("main score never gains review points; TKA review terminates on misses; English retains retry", () => {
  assert.deepEqual(firstScore(9, 3), { correct: 6, percent: 67 });
  for (const s of ["matematika", "bahasa-indonesia"] as const) {
    assert.equal(shouldRetry(s, "main", false), true);
    assert.equal(shouldRetry(s, "review", false), false);
    assert.equal(shouldRetry(s, "review", true), false);
  }
  assert.equal(shouldRetry("english", "review", false), true);
  // Three wrong main answers -> three review attempts regardless of outcome.
  const queue = [1, 2, 3]; let reviews = 0;
  for (let i = 0; i < queue.length; i++) { reviews++; if (shouldRetry("matematika", "review", false)) queue.push(queue[i]); }
  assert.equal(reviews, 3); assert.deepEqual(firstScore(9, 3), { correct: 6, percent: 67 });
});
test("history context is minimal and bounded; legacy result and unavailable storage safe", () => {
  const bi = tka.find(l => l.subject === "bahasa-indonesia")!;
  const context = attemptContext(bi, bi.exercises[0])!;
  const html = renderToStaticMarkup(<StimulusView stimulus={context.stimulus!} />);
  assert(html.includes(context.stimulus!.title));
  assert(html.includes("Bacaan:"));
  assert.equal(attemptContext(english[0], english[0].exercises[0]), undefined);
  assert(!AttemptContextSchema.safeParse({ ...context, html: "<script/>" }).success);
  assert(!AttemptContextSchema.safeParse({ ...context, evidence: Array(8).fill("界".repeat(2000)) }).success);
  assert.equal(parseResult('{"lessonId":"old","wrong":[]}')?.lessonId, "old");
  assert.equal(parseResult("invalid"), null);
  assert.deepEqual(getFinished(), []); assert.doesNotThrow(() => markFinished("file:lesson"));
  assert.doesNotThrow(() => saveResult({ lessonId: "x", lessonTitle: "x", total: 9, wrong: [], finishedAt: 0 }));
  assert.equal(loadResultRaw("x"), null);
  assert(renderToStaticMarkup(<FractionVisual visual={{ numerator: 2, denominator: 4 }} />).includes("2/4 bagian diarsir"));
});
test("all 270 English variations still satisfy legacy lesson contract", () => {
  let count = 0;
  for (const l of english) { const variations = JSON.parse(fs.readFileSync(`content/variations/${l.id}.json`, "utf8")); assert.equal(variations.length, 15); for (const exercises of variations) { LessonSchema.parse({ ...l, exercises }); count++; } }
  assert.equal(count, 270);
});

test("attempt payload validates legacy defaults and TKA field combinations", async () => {
  const { AttemptBodySchema } = await import("../lib/attemptSchema");
  const base = { runId: "abcd1234", lessonId: "old", lessonTitle: "Old", exerciseId: "e", exerciseType: "multiple_choice", phase: "main", question: "Q", userAnswer: "A", correctAnswer: "A", correct: true, gradedBy: "local" };
  assert.equal(AttemptBodySchema.parse(base).subject, "english");
  const l = tka.find(l => l.subject === "bahasa-indonesia")!;
  const e = l.exercises[0];
  const payload = { ...base, subject: l.subject, competency: e.competency, context: attemptContext(l, e) };
  assert(AttemptBodySchema.safeParse(payload).success);
  assert(!AttemptBodySchema.safeParse({ ...payload, subject: "english" }).success);
  assert(!AttemptBodySchema.safeParse({ ...payload, gradedBy: "ai" }).success);
  assert(!AttemptBodySchema.safeParse({ ...payload, context: undefined }).success);
  assert(!AttemptBodySchema.safeParse({ ...payload, context: { ...payload.context, evidence: ["not in text"] } }).success);
  assert(!AttemptBodySchema.safeParse({ ...payload, subject: "unknown" }).success);
});


test("preservation fingerprint tolerates JSONB key order but detects nested content changes", async () => {
  const { rowsFingerprint } = await import("../lib/contentFingerprint");
  const before = [{ id: "a", material: [{ type: "paragraph", title: "Title", text: "Text" }] }, { id: "b" }];
  const reordered = [{ id: "b" }, { material: [{ text: "Text", type: "paragraph", title: "Title" }], id: "a" }];
  assert.equal(rowsFingerprint(before), rowsFingerprint(reordered));
  assert.notEqual(rowsFingerprint(before), rowsFingerprint([{ id: "a", material: [{ type: "paragraph", title: "Title", text: "Changed" }] }, { id: "b" }]));
  assert.notEqual(rowsFingerprint([{ values: [1, 2] }]), rowsFingerprint([{ values: [2, 1] }]));
});
