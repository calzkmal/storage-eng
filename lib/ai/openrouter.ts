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
  /**
   * Ask OpenRouter to turn off hidden "thinking" on models that support it.
   * Reasoning tokens count against max_tokens, so a thinking model can spend
   * the whole budget before writing the JSON we need. If a model rejects the
   * flag, the chunk is retried once without it.
   */
  disableReasoning?: boolean;
};

export type ChatResult = { content: string; model: string };

/** OpenRouter rejects `models` arrays longer than this ("'models' array must have 3 items or fewer"). */
export const MAX_MODELS_PER_REQUEST = 3;

/**
 * Call OpenRouter with the priority list split into chunks of 3. OpenRouter
 * handles fallback inside a chunk; we only move to the next chunk when it
 * reports that every model in the chunk failed. The overall timeout is shared.
 */
export async function chatCompletion(messages: ChatMessage[], opts: ChatOptions): Promise<ChatResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new OpenRouterError("OPENROUTER_API_KEY is not set", undefined, "config");
  if (!opts.models.length) throw new OpenRouterError("No models configured", undefined, "config");

  const chunks: string[][] = [];
  for (let i = 0; i < opts.models.length; i += MAX_MODELS_PER_REQUEST) {
    chunks.push(opts.models.slice(i, i + MAX_MODELS_PER_REQUEST));
  }

  const deadline = Date.now() + opts.timeoutMs;
  let lastError: OpenRouterError | undefined;
  for (const chunk of chunks) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    try {
      return await chatCompletionOnce(messages, { ...opts, models: chunk, timeoutMs: remaining }, apiKey);
    } catch (err) {
      if (!(err instanceof OpenRouterError)) throw err;
      lastError = err;
      // Some models refuse to run with reasoning disabled; retry this chunk with it on.
      if (opts.disableReasoning && /reasoning/i.test(err.message) && err.kind !== "timeout") {
        try {
          const left = deadline - Date.now();
          if (left > 0) {
            return await chatCompletionOnce(
              messages,
              { ...opts, models: chunk, timeoutMs: left, disableReasoning: false },
              apiKey,
            );
          }
        } catch (retryErr) {
          if (!(retryErr instanceof OpenRouterError)) throw retryErr;
          lastError = retryErr;
          if (retryErr.kind !== "http" && retryErr.kind !== "response") throw retryErr;
          continue;
        }
      }
      // Only a provider-side failure justifies trying the next chunk.
      if (err.kind !== "http" && err.kind !== "response") throw err;
    }
  }
  throw lastError ?? new OpenRouterError("OpenRouter timed out", undefined, "timeout");
}

async function chatCompletionOnce(messages: ChatMessage[], opts: ChatOptions, apiKey: string): Promise<ChatResult> {
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
        ...(opts.disableReasoning ? { reasoning: { enabled: false } } : {}),
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
