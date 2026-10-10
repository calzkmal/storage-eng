// Explicit localhost-only production route/API smoke; never seeds or changes a remote DB.
import assert from "node:assert/strict";
import { loadLessonFiles } from "../lib/content";
import { attemptContext } from "../lib/attemptContext";
import { gradeLocal, answerText, correctAnswerText, exerciseSummary } from "../lib/grading";
async function main() {
const base = process.env.LOCAL_BASE_URL ?? "http://localhost:3100";
assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname), "LOCAL_BASE_URL must be localhost");
const lessons = loadLessonFiles();
const routes = ["/", "/subjects/english", "/subjects/matematika", "/subjects/bahasa-indonesia", "/progress", "/history", ...lessons.flatMap(l => [`/lesson/${l.id}`, `/lesson/${l.id}/sets`, `/lesson/${l.id}/done`])];
for (const path of routes) assert.equal((await fetch(base + path)).status, 200, path);
for (const path of ["/subjects/unknown", "/lesson/unknown", "/lesson/unknown/sets", "/lesson/unknown/done"]) assert.equal((await fetch(base + path)).status, 404, path);
assert.equal((await fetch(base + "/api/history?subject=unknown")).status, 400);
for (const subject of ["english", "matematika", "bahasa-indonesia"]) {
  const res = await fetch(`${base}/api/history?subject=${subject}`);
  assert.equal(res.status, 200); assert.deepEqual((await res.json()).runs, []);
}
const l = lessons.find(l => l.subject === "bahasa-indonesia")!;
const e = l.exercises[0]; assert(e.type === "multiple_choice");
const body = { runId: "abcd1234", lessonId: l.id, lessonTitle: l.title, subject: l.subject, competency: e.competency, exerciseId: e.id, exerciseType: e.type, phase: "main", question: exerciseSummary(e), userAnswer: answerText(e, e.answer), correctAnswer: correctAnswerText(e), correct: true, gradedBy: "local", context: attemptContext(l, e, gradeLocal(e, e.answer)?.details) };
const post = (payload: unknown) => fetch(base + "/api/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
const valid = await post(body); assert.equal(valid.status, 200); assert.equal((await valid.json()).stored, false);
assert.equal((await post({ ...body, gradedBy: "ai" })).status, 400);
assert.equal((await post({ ...body, context: { version: 1, html: "<script>" } })).status, 400);
assert.equal((await post({ ...body, context: undefined })).status, 400);
assert.equal((await post({ ...body, question: "x".repeat(33000) })).status, 413);
console.log(`Local smoke passed: ${routes.length} page routes, 4 not-found routes, filters, and attempt API validation. No signed learner cookie sent; no attempts stored.`);

}
main().catch(error => { console.error(error); process.exit(1); });
