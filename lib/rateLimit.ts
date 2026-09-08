import { getDb } from "./db";

// Fixed-window limit held in Postgres, so it counts across serverless isolates.
// The in-process map is a narrow fallback for a brief outage, never the ceiling.

const WINDOW_SEC = 10 * 60;

/** Grading calls a paid or quota-bound provider. */
export const GRADE_LIMIT = 30;
/** Cache hits cost an invocation but no provider call, so they are cheap, not free. */
export const CACHED_GRADE_LIMIT = GRADE_LIMIT * 10;
/** Writes are cheap but unbounded; this is an abuse ceiling, not a usage one. */
export const WRITE_LIMIT = 600;
/** Minting an identity creates a durable row, so it is rarer than an ordinary write. */
export const MINT_LIMIT = 20;
/** What a degraded limiter allows: enough to finish a lesson, not to drain a quota. */
const DEGRADED_LIMIT = 5;

/** PostgREST's code for "the function does not exist", which is a deploy fault. */
const FN_MISSING = "PGRST202";

export type RateLimitResult = { allowed: boolean; retryAfterSec: number; degraded?: boolean };

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

// While the shared counter is failing, stop adding load to a pool already under
// stress. Without this, the limiter's own traffic deepens the outage it reacts to.
const breaker = { openUntil: 0, failures: 0 };
const BREAKER_TRIP = 5;
const BREAKER_COOLDOWN_MS = 30_000;

const breakerOpen = () => Date.now() < breaker.openUntil;

// A missing function is a deploy fault, not a blip. Remember it, so the refusal
// is not undercut by the transient path, and recheck occasionally in case a
// later deploy fixed it.
let notDeployedUntil = 0;
const NOT_DEPLOYED_RECHECK_MS = 60_000;

function noteFailure(): void {
  if (++breaker.failures >= BREAKER_TRIP) {
    breaker.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
    breaker.failures = 0;
  }
}

/**
 * Never returns the nominal ceiling when the shared counter is unavailable.
 * A missing function is a provisioning fault and is refused outright; a
 * transient fault falls back to a per-isolate map at a much tighter limit.
 */
export async function checkRateLimit(key: string, limit = GRADE_LIMIT): Promise<RateLimitResult> {
  const db = getDb();
  if (!db) return localCheck(key, limit);

  // Refuse outright: falling back would advertise a ceiling that does not exist.
  if (Date.now() < notDeployedUntil) return { allowed: false, retryAfterSec: WINDOW_SEC, degraded: true };

  if (breakerOpen()) return { ...localCheck(key, Math.min(limit, DEGRADED_LIMIT)), degraded: true };

  const { data, error } = await db.rpc("consume_rate_limit", {
    p_bucket: key,
    p_limit: limit,
    p_window_seconds: WINDOW_SEC,
  });

  const row = (data as { allowed: boolean; retry_after_sec: number }[] | null)?.[0];
  if (row && !error) {
    breaker.failures = 0;
    return { allowed: row.allowed, retryAfterSec: row.retry_after_sec };
  }

  if (error?.code === FN_MISSING) {
    notDeployedUntil = Date.now() + NOT_DEPLOYED_RECHECK_MS;
    console.error("[rateLimit] consume_rate_limit is not deployed; refusing the limited route");
    return { allowed: false, retryAfterSec: WINDOW_SEC, degraded: true };
  }

  // Transient only: a stressed pool gets the breaker and a much tighter ceiling.
  noteFailure();
  console.error("[rateLimit] shared counter unavailable, degraded:", error?.message ?? "no row");
  return { ...localCheck(key, Math.min(limit, DEGRADED_LIMIT)), degraded: true };
}

/**
 * The client IP as a trusted hop reports it. `x-forwarded-for` is written by the
 * caller, so its leftmost value is never trusted. Null means the client cannot be
 * identified, which callers refuse: lumping them into one bucket would let a
 * single client spend everybody's budget.
 */
export function getClientKey(req: Request): string | null {
  if (process.env.VERCEL) {
    // Platform-set on every request and not forwardable by the caller.
    const ip = req.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim();
    return ip || null;
  }

  const hops = Number(process.env.TRUSTED_PROXY_HOPS ?? "");
  if (Number.isInteger(hops) && hops >= 1) {
    // With N trusted hops appending, the client is the Nth value from the right.
    const chain = (req.headers.get("x-forwarded-for") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return chain.length >= hops ? chain[chain.length - hops] || null : null;
  }

  // Single-user local development, opted into explicitly. Never set in production:
  // it puts every caller on earth in one bucket.
  if (process.env.RATE_LIMIT_SHARED_BUCKET === "1") return "local";

  return null;
}
