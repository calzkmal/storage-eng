/**
 * Anonymous, device-local persistence.
 * localStorage: which lessons are completed (a simple checkmark, spec §1).
 * sessionStorage: the result of the lesson just finished, for the done screen.
 */

export const COMPLETED_KEY = "ep:completed";
export const COMPLETED_EVENT = "ep:completed-changed";
export const resultKey = (lessonId: string) => `ep:result:${lessonId}`;

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
