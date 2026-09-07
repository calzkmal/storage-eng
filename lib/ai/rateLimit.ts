// Sliding-window rate limit per IP.

const WINDOW_MS = 10 * 60 * 1000;

/** Grading. */
export const GRADE_LIMIT = 30;
/** Regeneration is far more expensive for the free providers. */
export const GENERATE_LIMIT = 12;

const g = globalThis as unknown as { __aiRateLimit?: Map<string, number[]> };
const hits: Map<string, number[]> = (g.__aiRateLimit ??= new Map());

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSec: number };

export function checkRateLimit(key: string, limit = GRADE_LIMIT, now = Date.now()): RateLimitResult {
  const cutoff = now - WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= limit) {
    hits.set(key, recent);
    const retryAfterSec = Math.max(1, Math.ceil((recent[0] + WINDOW_MS - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing forever.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (!times.some((t) => t > cutoff)) hits.delete(k);
    }
  }

  return { allowed: true, remaining: limit - recent.length, retryAfterSec: 0 };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
