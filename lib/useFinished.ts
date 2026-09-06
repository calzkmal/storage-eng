"use client";

import { useMemo, useSyncExternalStore } from "react";
import { FINISHED_EVENT, FINISHED_KEY } from "./storage";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(FINISHED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(FINISHED_EVENT, callback);
  };
}

function getSnapshot(): string {
  try {
    return window.localStorage.getItem(FINISHED_KEY) ?? "";
  } catch {
    return "";
  }
}

const getServerSnapshot = () => "";

/**
 * Set of exercise-set ids that have been finished at least once on this
 * device. Hydration-safe (empty on the server, so it never mismatches).
 * Used to gate the "regenerate" button on the home page.
 */
export function useFinished(): Set<string> {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set<string>(Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []);
    } catch {
      return new Set<string>();
    }
  }, [raw]);
}
