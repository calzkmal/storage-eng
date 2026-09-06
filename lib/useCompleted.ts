"use client";

import { useMemo, useSyncExternalStore } from "react";
import { COMPLETED_EVENT, COMPLETED_KEY } from "./storage";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(COMPLETED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(COMPLETED_EVENT, callback);
  };
}

function getSnapshot(): string {
  try {
    return window.localStorage.getItem(COMPLETED_KEY) ?? "";
  } catch {
    return "";
  }
}

const getServerSnapshot = () => "";

/** Set of completed lesson ids, hydration-safe (empty on the server). */
export function useCompleted(): Set<string> {
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
