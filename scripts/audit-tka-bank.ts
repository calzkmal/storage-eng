// Independent JS arithmetic against Python's exact Fraction keys; no eval or answer-derived solver.
import fs from "node:fs";
import assert from "node:assert/strict";
import { loadLessonFiles } from "../lib/content";
import { loadTkaSets } from "../lib/tkaSets";
import { attemptContext } from "../lib/attemptContext";
import { gradeLocal, correctAnswerText } from "../lib/grading";
type Expr = number | [string, ...Expr[]];
type Probe = { expr: Expr; shown: string; correct: boolean };
function solve(expression: Expr): number {
  if (typeof expression === "number") return expression;
  const [op, ...inputs] = expression, a = inputs.map(solve);
  const gcd = (x: number, y: number): number => y ? gcd(y, x % y) : x;
  switch (op) {
    case "add": return a.reduce((s, x) => s + x, 0);
    case "sub": return a[0] - a[1];
    case "mul": return a.reduce((s, x) => s * x, 1);
    case "div": return a[0] / a[1];
    case "pow": return a[0] ** a[1];
    case "sqrt": return Math.sqrt(a[0]);
    case "gcd": return gcd(a[0], a[1]);
    case "lcm": return a[0] / gcd(a[0], a[1]) * a[1];
    case "min": return Math.min(...a);
    case "max": return Math.max(...a);
    case "median": { a.sort((x, y) => x - y); return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2; }
    case "mode": return a.reduce((best, x) => a.filter(v => v === x).length > a.filter(v => v === best).length ? x : best, a[0]);
    default: throw new Error(`Unknown operation ${op}`);
  }
}
function number(text: string) {
  const parts = text.replace(",", ".").split("/").map(Number);
  return parts.length === 2 ? parts[0] / parts[1] : parts[0];
}
const probes: Record<string, Probe[]> = JSON.parse(fs.readFileSync("content/tka-math-audit.json", "utf8"));
const lines = ["# Audit perluasan bank soal SD", "", "Cakupan mengikuti daftar pengguna; materi latihan ini bukan pernyataan seluruhnya termasuk kisi-kisi resmi TKA. Review ahli/manusia belum dilakukan.", "", "Math: jawaban generator Python Fraction dibandingkan dengan evaluator aritmetika JS terpisah. BI: evidence persis, kecocokan kunci dan detail format, jumlah kata dan grouping diperiksa. Kebenaran semantik BI diperiksa lewat sumber authoring, bukan disimpulkan dari substring saja. Dua bacaan kontekstual tambahan per topik memakai catatan konsep yang sama; set melatih pemahaman dan evaluasi klaim yang berbeda, bukan 837 konsep terpisah.", ""];
let math = 0, bi = 0, assertions = 0;
const used = new Set<string>();
for (const lesson of loadLessonFiles().filter(l => l.subject !== "english")) {
  const sets = [lesson.exercises, ...loadTkaSets(lesson)]; assert.equal(sets.length, 3);
  lines.push(`## ${lesson.title}`, "", `\`${lesson.id}\`: 3 set × 9 soal.`, "");
  const fingerprints = sets.map(set => JSON.stringify(set.map(e => JSON.stringify({
    type: e.type, question: "question" in e ? e.question : "", stimulus: e.stimulusId,
    options: e.type === "multiple_choice" ? [...e.options].sort() : e.type === "multiple_select" ? e.options.map(o => `${o.text}:${e.answer.includes(o.id)}`).sort() : e.type === "statement_category" ? e.statements.map(s => `${s.text}:${s.answer}`).sort() : [],
    correct: e.type === "multiple_choice" ? e.answer : undefined,
  })).sort()));
  assert.equal(new Set(fingerprints).size, 3, lesson.id);
  for (const [i, set] of sets.entries()) {
    for (const ex of set) {
      assert(!used.has(ex.id), ex.id); used.add(ex.id);
      const answer = ex.type === "statement_category" ? Object.fromEntries(ex.statements.map(s => [s.id, s.answer])) : "answer" in ex ? ex.answer : "";
      const grade = gradeLocal(ex, answer); assert.equal(grade?.correct, true, ex.id);
      assert(correctAnswerText(ex).length <= 600, `${ex.id}: display >600`);
      assert(attemptContext(lesson, ex, grade?.details), ex.id);
      if (lesson.subject === "matematika") {
        math++;
        if (probes[ex.id]) {
          const actual = ex.type === "statement_category" ? ex.statements.map(s => s.answer === "yes") : ex.type === "multiple_select" ? ex.options.map(o => ex.answer.includes(o.id)) : [true];
          assert.equal(actual.length, probes[ex.id].length);
          for (const [j, probe] of probes[ex.id].entries()) {
            const equal = Math.abs(solve(probe.expr) - number(probe.shown)) < 1e-9;
            assert.equal(equal, probe.correct, ex.id); assert.equal(actual[j], equal, ex.id); assertions++;
            if (ex.type === "multiple_choice") assert.equal(ex.answer, probe.shown);
            else assert((ex.type === "multiple_select" ? ex.options[j] : ex.type === "statement_category" ? ex.statements[j] : null)?.text.includes(`Jawaban: ${probe.shown}.`));
          }
          lines.push(`- Set ${i + 1}, \`${ex.id}\`: ${probes[ex.id].length} kunci/claim cocok evaluator independen.`);
        } else { assert.equal(i, 0); lines.push(`- Set 1, \`${ex.id}\`: audit seed asli di TKA-SD-CONTENT-AUDIT.md.`); }
      } else {
        bi++; const stimulus = lesson.stimuli!.find(s => s.id === ex.stimulusId)!;
        assert(stimulus); const words = stimulus.paragraphs.join(" ").split(/\s+/).length; assert(words >= 150 && words <= 200);
        for (const quote of ex.evidence!) assert(stimulus.paragraphs.join("\n").includes(quote), ex.id);
        lines.push(`- Set ${i + 1}, \`${ex.id}\`: evidence stimulus \`${stimulus.id}\` cocok; ${words} kata.`);
      }
    }
    if (lesson.subject === "bahasa-indonesia") for (const stimulus of lesson.stimuli!) assert.equal(set.filter(e => e.stimulusId === stimulus.id).length, 3);
  }
  lines.push("");
}
assert.equal(math, 405); assert.equal(bi, 432); assert.equal(Object.keys(probes).length, 378);
lines.push(`Total: ${math + bi} soal pada 93 set; ${assertions} klaim aritmetika baru diperiksa, 432 set evidence soal BI diperiksa.`, "");
fs.writeFileSync("docs/TKA-SD-BANK-AUDIT.md", lines.join("\n"));
console.log(`Expanded audit passed: ${math} Math, ${bi} BI; ${assertions} independent numeric claims.`);
