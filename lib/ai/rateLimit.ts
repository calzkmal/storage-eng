/** Sliding-window rate limiter per client IP: 30 requests / 10 minutes (spec §7.1 step 3). */

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 30;

const g = globalThis as unknown as { __aiRateLimit?: Map<string, number[]> };
const hits: Map<string, number[]> = (g.__aiRateLimit ??= new Map());

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSec: number };

export function checkRateLimit(ip: string, now = Date.now()): RateLimitResult {
  const cutoff = now - WINDOW_MS;
  const recent = (hits.get(ip) ?? []).filter((t) => t > cutoff);

  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    const retryAfterSec = Math.max(1, Math.ceil((recent[0] + WINDOW_MS - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the map does not grow forever.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((t) => t > cutoff)) hits.delete(key);
    }
  }

  return { allowed: true, remaining: LIMIT - recent.length, retryAfterSec: 0 };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
