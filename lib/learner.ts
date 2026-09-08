"use client";

import { useMemo, useSyncExternalStore } from "react";

// The identity itself is a signed HttpOnly cookie the server sets, so script
// here never sees it. Only the display name is kept in localStorage.

export const LEARNER_KEY = "ep:learner";
export const LEARNER_EVENT = "ep:learner-changed";

export type Learner = { name: string };

function readRaw(): string {
  try {
    return window.localStorage.getItem(LEARNER_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Tolerates the older `{ id, name }` shape by keeping only the name. */
export function parseLearner(raw: string): Learner | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Learner>;
    return typeof v?.name === "string" && v.name.trim() ? { name: v.name } : null;
  } catch {
    return null;
  }
}

export function getLearner(): Learner | null {
  return parseLearner(readRaw());
}

function write(learner: Learner): void {
  try {
    window.localStorage.setItem(LEARNER_KEY, JSON.stringify(learner));
    window.dispatchEvent(new Event(LEARNER_EVENT));
  } catch {
    // Storage unavailable: history just is not kept.
  }
}

/** Create or rename the profile. The server keeps the id on its side of the cookie. */
export function saveLearner(name: string): Learner {
  const learner: Learner = { name: name.trim().slice(0, 40) };
  write(learner);
  try {
    void fetch("/api/learner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(learner),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // The profile still works without the server copy.
  }
  return learner;
}

/** Erase the profile here and on the server. */
export async function deleteLearner(): Promise<void> {
  try {
    window.localStorage.removeItem(LEARNER_KEY);
    window.dispatchEvent(new Event(LEARNER_EVENT));
  } catch {
    // Storage unavailable.
  }
  try {
    await fetch("/api/learner", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: "{}" });
  } catch {
    // Best effort.
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(LEARNER_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(LEARNER_EVENT, cb);
  };
}

const getServerSnapshot = () => "";

/** `undefined` while unread on the server, `null` when there is no profile. */
export function useLearner(): Learner | null | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return useMemo(() => (mounted ? parseLearner(raw) : undefined), [mounted, raw]);
}

/** Flag a finished set. Fire and forget. */
export function recordSetCompleted(lessonId: string, setId: string): void {
  if (setId.startsWith("file:")) return;
  post("/api/learner/sets", { lessonId, setId });
}

/** Record one answer. Fire and forget. */
export function recordAttempt(body: Record<string, unknown>): void {
  post("/api/attempts", body);
}

// sendBeacon survives the navigation at the end of a lesson, and carries the
// same-origin cookie the routes read the learner from.
function post(url: string, body: Record<string, unknown>): void {
  try {
    const payload = JSON.stringify(body);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
  } catch {
    // Best effort.
  }
}
