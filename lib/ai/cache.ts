import { createHash } from "node:crypto";
import { normalize } from "../grading";
import type { GradeResult } from "./types";

/** Small in-memory LRU for AI grading results (spec §2, §7.1 step 2). */
class LRU<V> {
  private map = new Map<string, V>();
  constructor(private max: number) {}

  get(key: string): V | undefined {
    const v = this.map.get(key);
    if (v === undefined) return undefined;
    // refresh recency
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    while (this.map.size > this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  get size(): number {
    return this.map.size;
  }
}

export type CachedGrade = GradeResult & { modelUsed: string };

// Persist across dev HMR reloads by hanging the instance on globalThis.
const g = globalThis as unknown as { __aiGradeCache?: LRU<CachedGrade> };
export const gradeCache: LRU<CachedGrade> = (g.__aiGradeCache ??= new LRU<CachedGrade>(500));

export function cacheKey(exerciseId: string, userAnswer: string): string {
  return createHash("sha256").update(`${exerciseId} ${normalize(userAnswer)}`).digest("hex");
}
