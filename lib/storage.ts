/**
 * Anonymous, device-local persistence.
 * localStorage: which exercise sets have been played through (FINISHED_KEY).
 * sessionStorage: the result of the lesson just finished, for the done screen.
 */

export const resultKey = (lessonId: string) => `ep:result:${lessonId}`;

/**
 * Stores the ids of exercise sets (database ids, or file:<lessonId> without a
 * database) that have been played through at least once on this device. It
 * drives both the ✓ on a lesson card (spec §1) and the "regenerate" button:
 * because a regenerated set gets a new id, a lesson loses its ✓ and locks
 * again after regeneration until the new questions are played, and both come
 * back when the original set is restored.
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
  /** Kept with the result so the done screen needs no database lookup. */
  lessonTitle: string;
  total: number;
  wrong: WrongItem[];
  finishedAt: number;
};

function getIdList(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function addId(key: string, event: string, id: string): void {
  try {
    const set = new Set(getIdList(key));
    if (set.has(id)) return;
    set.add(id);
    window.localStorage.setItem(key, JSON.stringify([...set]));
    window.dispatchEvent(new Event(event));
  } catch {
    /* storage unavailable: ignore */
  }
}

export function getFinished(): string[] {
  return getIdList(FINISHED_KEY);
}

/** Record that an exercise set (by set id) has been played through once. */
export function markFinished(setId: string): void {
  addId(FINISHED_KEY, FINISHED_EVENT, setId);
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
