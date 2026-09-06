/**
 * Anonymous, device-local persistence.
 * localStorage: which lessons are completed (a simple checkmark, spec §1),
 * and which exercise SETS have been played through (see FINISHED_KEY).
 * sessionStorage: the result of the lesson just finished, for the done screen.
 */

export const COMPLETED_KEY = "ep:completed";
export const COMPLETED_EVENT = "ep:completed-changed";
export const resultKey = (lessonId: string) => `ep:result:${lessonId}`;

/**
 * Gates the "regenerate exercises" button on the home page. Stores the ids of
 * exercise sets (database ids, or file:<lessonId> without a database) that
 * have been finished at least once on this device. Because a regenerated set
 * gets a new id, a lesson locks again after regeneration until the new set is
 * played, and unlocks again when reset to the original set.
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

export function getCompleted(): string[] {
  return getIdList(COMPLETED_KEY);
}

export function markCompleted(lessonId: string): void {
  addId(COMPLETED_KEY, COMPLETED_EVENT, lessonId);
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
