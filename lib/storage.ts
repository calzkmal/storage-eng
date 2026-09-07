// Device-local progress. localStorage: finished sets. sessionStorage: last result.

export const resultKey = (lessonId: string) => `ep:result:${lessonId}`;

// Set ids played through on this device. Drives the ✓ and the regenerate button;
// a regenerated set has a new id, so both reset until it is played.
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
  /** Kept here so the done screen needs no database lookup. */
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
    // Storage unavailable.
  }
}

export function getFinished(): string[] {
  return getIdList(FINISHED_KEY);
}

/** Mark a set as played through. */
export function markFinished(setId: string): void {
  addId(FINISHED_KEY, FINISHED_EVENT, setId);
}

export function saveResult(result: LessonResult): void {
  try {
    window.sessionStorage.setItem(resultKey(result.lessonId), JSON.stringify(result));
  } catch {
    // Storage unavailable.
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
