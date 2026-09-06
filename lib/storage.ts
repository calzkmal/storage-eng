/**
 * Anonymous, device-local persistence.
 * localStorage: which lessons are completed (a simple checkmark, spec §1),
 * and which lesson has had its CURRENTLY ACTIVE exercise set (built-in or
 * regenerated) finished at least once — see FINISHED_KEY below.
 * sessionStorage: the result of the lesson just finished, for the done screen.
 */

export const COMPLETED_KEY = "ep:completed";
export const COMPLETED_EVENT = "ep:completed-changed";
export const resultKey = (lessonId: string) => `ep:result:${lessonId}`;

/**
 * Gates the "regenerate exercises" button on the home page: a lesson only
 * offers regeneration once its current set has actually been played through.
 * Unlike COMPLETED_KEY (a permanent, spec-required checkmark), this flag is
 * reset whenever a lesson's active set changes — see lib/overrides.ts.
 */
export const FINISHED_KEY = "ep:finished";
export const FINISHED_EVENT = "ep:finished-changed";

export type WrongItem = {
  exerciseId: string;
  summary: string;
  yourAnswer: string;
  correctAnswer: string;
};

export type LessonResult = {
  lessonId: string;
  total: number;
  wrong: WrongItem[];
  finishedAt: number;
};

export function getCompleted(): string[] {
  try {
    const raw = window.localStorage.getItem(COMPLETED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function markCompleted(lessonId: string): void {
  try {
    const set = new Set(getCompleted());
    if (set.has(lessonId)) return;
    set.add(lessonId);
    window.localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set]));
    window.dispatchEvent(new Event(COMPLETED_EVENT));
  } catch {
    /* storage unavailable: ignore */
  }
}

function getIdSet(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function getFinished(): string[] {
  return getIdSet(FINISHED_KEY);
}

/** Mark that lesson's currently active exercise set as finished (has been played through once). */
export function markFinished(lessonId: string): void {
  try {
    const set = new Set(getFinished());
    if (set.has(lessonId)) return;
    set.add(lessonId);
    window.localStorage.setItem(FINISHED_KEY, JSON.stringify([...set]));
    window.dispatchEvent(new Event(FINISHED_EVENT));
  } catch {
    /* storage unavailable: ignore */
  }
}

/** Called when a lesson's active set changes (a fresh set has not been finished yet). */
export function clearFinished(lessonId: string): void {
  try {
    const set = new Set(getFinished());
    if (!set.has(lessonId)) return;
    set.delete(lessonId);
    window.localStorage.setItem(FINISHED_KEY, JSON.stringify([...set]));
    window.dispatchEvent(new Event(FINISHED_EVENT));
  } catch {
    /* storage unavailable: ignore */
  }
}

export function saveResult(result: LessonResult): void {
  try {
    window.sessionStorage.setItem(resultKey(result.lessonId), JSON.stringify(result));
  } catch {
    /* ignore */
  }
}

export function loadResultRaw(lessonId: string): string | null {
  try {
    return window.sessionStorage.getItem(resultKey(lessonId));
  } catch {
    return null;
  }
}

export function parseResult(raw: string | null): LessonResult | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as LessonResult;
    return r && Array.isArray(r.wrong) ? r : null;
  } catch {
    return null;
  }
}
