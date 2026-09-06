"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Accountless identity.
 *
 * The learner is identified by a random UUID minted in the browser and kept in
 * localStorage. The name they type is only a label on that UUID, never the
 * identity itself: two people who type "Budi" are two different learners, and
 * one person on two devices is two learners. The id survives closing and
 * reopening the browser; it does not survive clearing site data, a private
 * window, another browser, or another device.
 */

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
    /* storage unavailable: the session still works, history just is not kept */
  }
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Very old browsers: good enough for an anonymous local id.
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  }
}

/** Create the profile on first visit, or rename the existing one, keeping the same id. */
export async function saveLearner(name: string): Promise<Learner> {
  const trimmed = name.trim().slice(0, 40);
  const existing = getLearner();
  const learner: Learner = { id: existing?.id ?? newId(), name: trimmed };
  write(learner);
  // Best effort: the profile is usable offline, the server copy is for history.
  try {
    await fetch("/api/learner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(learner),
    });
  } catch {
    /* ignore */
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

/**
 * Current profile, hydration-safe. `undefined` means "not read yet" (server
 * render), `null` means "no profile on this device", so a first-visit prompt
 * can wait for the real answer instead of flashing.
 */
export function useLearner(): Learner | null | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return useMemo(() => (mounted ? parseLearner(raw) : undefined), [mounted, raw]);
}

/** Record one checked answer. Fire and forget: history is best effort. */
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
