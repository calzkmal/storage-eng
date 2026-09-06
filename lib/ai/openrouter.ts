/**
 * Thin fetch wrapper around OpenRouter chat completions (spec §7.2).
 * - Sends a `models` array so OpenRouter handles cross-model fallback itself.
 * - Enforces a timeout via AbortController.
 * - Never hand-rolls a retry loop across models.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly kind: "config" | "timeout" | "http" | "response" = "http",
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export type ChatOptions = {
  models: string[];
  timeoutMs: number;
  temperature?: number;
  maxTokens?: number;
};

export type ChatResult = { content: string; model: string };

export async function chatCompletion(messages: ChatMessage[], opts: ChatOptions): Promise<ChatResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new OpenRouterError("OPENROUTER_API_KEY is not set", undefined, "config");
  if (!opts.models.length) throw new OpenRouterError("No models configured", undefined, "config");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
        "X-Title": process.env.APP_NAME ?? "English Practice",
      },
      body: JSON.stringify({
        model: opts.models[0],
        models: opts.models,
        messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 300,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new OpenRouterError(`OpenRouter HTTP ${res.status}: ${text.slice(0, 300)}`, res.status, "http");
    }

    const data = (await res.json()) as {
      model?: string;
      error?: { message?: string; code?: number };
      choices?: { message?: { content?: string | null } }[];
    };

    // When every model in the list fails, OpenRouter returns the last error.
    if (data.error) {
      throw new OpenRouterError(`OpenRouter error: ${data.error.message ?? "unknown"}`, data.error.code, "response");
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new OpenRouterError("OpenRouter returned no content", undefined, "response");
    }

    return { content, model: data.model ?? opts.models[0] };
  } catch (err) {
    if (err instanceof OpenRouterError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new OpenRouterError(`OpenRouter timed out after ${opts.timeoutMs}ms`, undefined, "timeout");
    }
    throw new OpenRouterError(err instanceof Error ? err.message : String(err), undefined, "http");
  } finally {
    clearTimeout(timer);
  }
}

/** GET /api/v1/models filtered to IDs ending in ":free". Used by scripts/check-models.ts. */
export async function listFreeModelIds(timeoutMs = 15000): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", { signal: controller.signal });
    if (!res.ok) throw new OpenRouterError(`models endpoint HTTP ${res.status}`, res.status);
    const data = (await res.json()) as { data?: { id: string }[] };
    return (data.data ?? []).map((m) => m.id).filter((id) => id.endsWith(":free"));
  } finally {
    clearTimeout(timer);
  }
}
