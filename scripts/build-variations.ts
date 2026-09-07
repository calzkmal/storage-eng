// Composes N variations per lesson from its item pool and writes
// content/variations/<lessonId>.json. Deterministic: same input, same output.
//
//   npm run build:variations
import fs from "node:fs";
import path from "node:path";
import { LessonSchema, type Exercise, type ExerciseType } from "../lib/schema";
import { loadLessonFiles } from "../lib/content";
import { POOLS } from "./variations/pools";
import type { PoolItem } from "./variations/builders";

const VARIATIONS = Number(process.env.VARIATIONS ?? 15);
const OUT_DIR = path.join(process.cwd(), "content", "variations");

const ID_ABBR: Record<ExerciseType, string> = {
  multiple_choice: "mc",
  fill_blank: "fb",
  word_order: "wo",
  matching: "match",
  flip_sentence: "flip",
  free_write: "fw",
};

/** Deterministic PRNG so rebuilds do not churn the files. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/**
 * Picks `count` items of the required types, taking the least-used items first
 * so the pool is spread evenly across variations rather than reusing favourites.
 */
function pick(pool: PoolItem[], plan: ExerciseType[], used: Map<PoolItem, number>, rand: () => number): PoolItem[] {
  const chosen: PoolItem[] = [];
  for (const type of plan) {
    const candidates = pool.filter((p) => p.type === type && !chosen.includes(p));
    if (!candidates.length) throw new Error(`pool has no ${type} left`);
    const min = Math.min(...candidates.map((c) => used.get(c) ?? 0));
    const leastUsed = candidates.filter((c) => (used.get(c) ?? 0) === min);
    const item = shuffle(leastUsed, rand)[0];
    chosen.push(item);
    used.set(item, (used.get(item) ?? 0) + 1);
  }
  return chosen;
}

function main() {
  const lessons = loadLessonFiles();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let total = 0;
  const report: string[] = [];

  for (const lesson of lessons) {
    const pool = POOLS[lesson.id];
    if (!pool) {
      report.push(`✗ ${lesson.id}: no pool defined`);
      continue;
    }
    // Every variation keeps the lesson's own shape: same count, same type mix.
    const plan = lesson.exercises.map((e) => e.type);
    const rand = rng(hash(lesson.id));
    const used = new Map<PoolItem, number>();
    const seen = new Set<string>();
    const sets: Exercise[][] = [];

    for (let v = 0; v < VARIATIONS; v++) {
      let items: PoolItem[] | null = null;
      // A handful of tries is enough to avoid an identical repeat.
      for (let attempt = 0; attempt < 12; attempt++) {
        const candidate = pick(pool, plan, new Map(used), rand);
        const key = candidate.map((c) => JSON.stringify(c)).join("|");
        if (!seen.has(key)) {
          seen.add(key);
          items = candidate;
          break;
        }
      }
      if (!items) throw new Error(`${lesson.id}: pool too small for ${VARIATIONS} distinct variations`);
      for (const it of items) used.set(it, (used.get(it) ?? 0) + 1);

      const counters: Partial<Record<ExerciseType, number>> = {};
      const exercises = items.map((it) => {
        counters[it.type] = (counters[it.type] ?? 0) + 1;
        return { ...it, id: `${lesson.id}-v${v + 1}-${ID_ABBR[it.type]}-${counters[it.type]}` } as Exercise;
      });

      const parsed = LessonSchema.safeParse({ ...lesson, exercises });
      if (!parsed.success) {
        console.error(`✗ ${lesson.id} variation ${v + 1}:`);
        for (const i of parsed.error.issues) console.error(`    ${i.path.join(".")}: ${i.message}`);
        process.exit(1);
      }
      sets.push(parsed.data.exercises);
    }

    fs.writeFileSync(path.join(OUT_DIR, `${lesson.id}.json`), JSON.stringify(sets, null, 2) + "\n");
    total += sets.length;
    const coverage = pool.filter((p) => (used.get(p) ?? 0) > 0).length;
    report.push(`✓ ${lesson.id.padEnd(28)} ${sets.length} variations from a pool of ${pool.length} (${coverage} items used)`);
  }

  for (const line of report) console.log(line);
  console.log(`\n${total} variations written to content/variations/`);
  const missing = lessons.filter((l) => !POOLS[l.id]);
  if (missing.length) {
    console.error(`\n${missing.length} lesson(s) still need a pool: ${missing.map((l) => l.id).join(", ")}`);
    process.exit(1);
  }
}

main();
