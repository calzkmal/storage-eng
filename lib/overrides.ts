"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Exercise } from "./schema";
import { clearFinished, markFinished } from "./storage";

/**
 * Regenerated exercise sets live on the learner's device (localStorage) so the
 * feature works the same locally and on Vercel, where the filesystem is read-only.
 * A lesson with an override uses those exercises instead of the built-in file.
 */

export const OVERRIDES_KEY = "ep:overrides";
export const OVERRIDES_EVENT = "ep:overrides-changed";

export type LessonOverride = {
  exercises: Exercise[];
  generatedAt: number;
  modelUsed: string;
};

export type Overrides = Record<string, LessonOverride>;

function readRaw(): string {
  try {
    return window.localStorage.getItem(OVERRIDES_KEY) ?? "";
  } catch {
    return "";
  }
}

export function parseOverrides(raw: string): Overrides {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    if (typeof obj !== "object" || obj === null) return {};
    const out: Overrides = {};
    for (const [id, v] of Object.entries(obj as Record<string, unknown>)) {
      if (
        typeof v === "object" &&
        v !== null &&
        Array.isArray((v as LessonOverride).exercises) &&
        (v as LessonOverride).exercises.length > 0
      ) {
        out[id] = v as LessonOverride;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function getOverrides(): Overrides {
  return parseOverrides(readRaw());
}

export function getOverride(lessonId: string): LessonOverride | null {
  return getOverrides()[lessonId] ?? null;
}

function write(all: Overrides): void {
  try {
    if (Object.keys(all).length === 0) window.localStorage.removeItem(OVERRIDES_KEY);
    else window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(OVERRIDES_EVENT));
  } catch {
    /* storage unavailable: ignore */
  }
}

/**
 * A freshly generated set replaces the lesson's active content, so it clears
 * the "finished" flag: the regenerate button only reappears (see
 * lib/useFinished.ts) once this new set has actually been played through.
 */
export function setOverride(lessonId: string, override: Omit<LessonOverride, "generatedAt">): void {
  write({ ...getOverrides(), [lessonId]: { ...override, generatedAt: Date.now() } });
  clearFinished(lessonId);
}

/**
 * Reverting to the built-in file restores content that, by construction, was
 * already finished at least once (you can only regenerate a lesson after
 * finishing its current set), so it is safe to mark it finished again.
 */
export function clearOverride(lessonId: string): void {
  const all = getOverrides();
  delete all[lessonId];
  write(all);
  markFinished(lessonId);
}

export function clearAllOverrides(): void {
  const ids = Object.keys(getOverrides());
  write({});
  ids.forEach(markFinished);
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(OVERRIDES_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(OVERRIDES_EVENT, cb);
  };
}

const getServerSnapshot = () => "";

/** Hydration-safe view of all overrides (empty on the server). */
export function useOverrides(): Overrides {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  return useMemo(() => parseOverrides(raw), [raw]);
}

export type GenerateResult =
  | { ok: true; exercises: Exercise[]; modelUsed: string; attempts: number }
  | { ok: false; error: string };

/** POST /api/ai/generate for one lesson. Generation can take a minute on free models. */
export async function requestGeneration(lessonId: string): Promise<GenerateResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 320_000);
  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        res.status === 429
          ? "Too many regenerations right now. Try again in a few minutes."
          : (data.error as string | undefined) ?? `Request failed (${res.status})`;
      return { ok: false, error: msg };
    }
    if (!Array.isArray(data.exercises) || !data.exercises.length) return { ok: false, error: "Empty result" };
    return { ok: true, exercises: data.exercises, modelUsed: data.modelUsed ?? "unknown", attempts: data.attempts ?? 1 };
  } catch (err) {
    return { ok: false, error: err instanceof Error && err.name === "AbortError" ? "Timed out" : "Network error" };
  } finally {
    clearTimeout(timer);
  }
}
