/** Client-side helpers for the regenerate / reset endpoints. */

export type GenerateResult =
  | { ok: true; setId: string; version: number; exerciseCount: number; modelUsed: string }
  | { ok: false; error: string };

/** POST /api/ai/generate for one lesson. Generation can take a minute on free models. */
export async function requestGeneration(lessonId: string): Promise<GenerateResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 320_000);
  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        res.status === 429
          ? "Too many regenerations right now. Try again in a few minutes."
          : ((data.error as string | undefined) ?? `Request failed (${res.status})`);
      return { ok: false, error: msg };
    }
    if (typeof data.setId !== "string") return { ok: false, error: "Unexpected response" };
    return {
      ok: true,
      setId: data.setId,
      version: Number(data.version ?? 0),
      exerciseCount: Number(data.exerciseCount ?? 0),
      modelUsed: String(data.modelUsed ?? "unknown"),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error && err.name === "AbortError" ? "Timed out" : "Network error" };
  } finally {
    clearTimeout(timer);
  }
}

/** POST /api/lessons/[id]/reset: make the seeded original set active again. */
export async function requestReset(lessonId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/reset`, { method: "POST" });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: (data.error as string | undefined) ?? `Request failed (${res.status})` };
  } catch {
    return { ok: false, error: "Network error" };
  }
}
