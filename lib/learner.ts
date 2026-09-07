"use client";

import { useMemo, useSyncExternalStore } from "react";

// Identity is a random UUID in localStorage; the name is only a label on it.
// Survives a browser restart, not cleared site data or another device.

export const LEARNER_KEY = "ep:learner";
export const LEARNER_EVENT = "ep:learner-changed";

export type Learner = { id: string; name: string };

function readRaw(): string {
  try {
    return window.localStorage.getItem(LEARNER_KEY) ?? "";
  } catch {
    return "";
  }
}

export function parseLearner(raw: string): Learner | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Learner>;
    if (typeof v?.id === "string" && v.id && typeof v.name === "string" && v.name.trim()) {
      return { id: v.id, name: v.name };
    }
    return null;
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

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Old browsers.
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  }
}

/** Create or rename the profile, keeping the same id. Server copy is sent in the background. */
export function saveLearner(name: string): Learner {
  const trimmed = name.trim().slice(0, 40);
  const existing = getLearner();
  const learner: Learner = { id: existing?.id ?? newId(), name: trimmed };
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

/** Record one answer. Fire and forget. */
export function recordAttempt(body: Record<string, unknown>): void {
  try {
    const payload = JSON.stringify(body);
    const url = "/api/attempts";
    // sendBeacon survives the navigation at the end of a lesson.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
  } catch {
    /* ignore */
  }
}
