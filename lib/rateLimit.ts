import { getDb } from "./db";

// Fixed-window limit held in Postgres, so it counts across serverless isolates.
// The in-process map is only the fallback for when the database is unreachable.

const WINDOW_SEC = 10 * 60;

/** Grading calls a paid or quota-bound provider. */
export const GRADE_LIMIT = 30;
/** Writes are cheap but unbounded; this is an abuse ceiling, not a usage one. */
export const WRITE_LIMIT = 600;

export type RateLimitResult = { allowed: boolean; retryAfterSec: number };

const g = globalThis as unknown as { __rateLimit?: Map<string, number[]> };
const local: Map<string, number[]> = (g.__rateLimit ??= new Map());

function localCheck(key: string, limit: number, now = Date.now()): RateLimitResult {
  const cutoff = now - WINDOW_SEC * 1000;
  const recent = (local.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= limit) {
    local.set(key, recent);
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((recent[0] + WINDOW_SEC * 1000 - now) / 1000)) };
  }

  recent.push(now);
  local.set(key, recent);
  if (local.size > 5000) {
    for (const [k, times] of local) {
      if (!times.some((t) => t > cutoff)) local.delete(k);
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export async function checkRateLimit(key: string, limit = GRADE_LIMIT): Promise<RateLimitResult> {
  const db = getDb();
  if (!db) return localCheck(key, limit);

  const { data, error } = await db.rpc("consume_rate_limit", {
    p_bucket: key,
    p_limit: limit,
    p_window_seconds: WINDOW_SEC,
  });

  const row = (data as { allowed: boolean; retry_after_sec: number }[] | null)?.[0];
  if (error || !row) {
    console.error("[rateLimit] shared counter unavailable:", error?.message ?? "no row");
    return localCheck(key, limit);
  }
  return { allowed: row.allowed, retryAfterSec: row.retry_after_sec };
}

/**
 * The client IP as the platform reports it. `x-forwarded-for` is written by the
 * caller, so its leftmost value is never trusted. Null means the client could
 * not be identified, which the caller should refuse rather than lump together:
 * one shared bucket would let a single abuser lock everyone else out.
 */
export function getClientKey(req: Request): string | null {
  if (process.env.VERCEL) {
    const platform = req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-real-ip");
    const ip = platform?.split(",")[0].trim();
    return ip || null;
  }
  // No trusted proxy off Vercel, so the whole process shares one bucket.
  return "local";
}
