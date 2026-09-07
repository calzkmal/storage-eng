// OpenRouter chat completions. Cross-model fallback is OpenRouter's own, via `models`.

import type { ChatMessage, ChatResult } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    /** "empty": a 200 with no content, so that one model answered uselessly. */
    public readonly kind: "config" | "timeout" | "http" | "response" | "empty" = "http",
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
  /** Reasoning tokens eat max_tokens, so a thinking model can answer empty. */
  disableReasoning?: boolean;
};

/** OpenRouter rejects `models` arrays longer than this. */
export const MAX_MODELS_PER_REQUEST = 3;

/**
 * Walks the model list, sending up to 3 per request so OpenRouter can fall back
 * inside one call. It only falls back on provider errors, so a model that
 * answers with an empty 200 is dropped and the rest are sent again.
 */
export async function chatCompletion(messages: ChatMessage[], opts: ChatOptions): Promise<ChatResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new OpenRouterError("OPENROUTER_API_KEY is not set", undefined, "config");
  if (!opts.models.length) throw new OpenRouterError("No models configured", undefined, "config");

  const deadline = Date.now() + opts.timeoutMs;
  let queue = [...opts.models];
  let lastError: OpenRouterError | undefined;

  while (queue.length) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const chunk = queue.slice(0, MAX_MODELS_PER_REQUEST);

    try {
      return await chatCompletionOnce(messages, { ...opts, models: chunk, timeoutMs: remaining }, apiKey);
    } catch (err) {
      if (!(err instanceof OpenRouterError)) throw err;
      lastError = err;

      // Some models refuse to run with reasoning off.
      if (opts.disableReasoning && /reasoning/i.test(err.message) && err.kind !== "timeout") {
        const left = deadline - Date.now();
        if (left > 0) {
          try {
            return await chatCompletionOnce(
              messages,
              { ...opts, models: chunk, timeoutMs: left, disableReasoning: false },
              apiKey,
            );
          } catch (retryErr) {
            if (!(retryErr instanceof OpenRouterError)) throw retryErr;
            lastError = retryErr;
          }
        }
      }

      // An empty reply blames one model; anything else failed the whole chunk.
      if (lastError.kind === "empty") queue = queue.slice(1);
      else if (lastError.kind === "http" || lastError.kind === "response") queue = queue.slice(chunk.length);
      else throw lastError;
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

    // When every model fails, OpenRouter returns the last error in a 200.
    if (data.error) {
      throw new OpenRouterError(`OpenRouter error: ${data.error.message ?? "unknown"}`, data.error.code, "response");
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new OpenRouterError(`OpenRouter: ${data.model ?? opts.models[0]} returned no content`, undefined, "empty");
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

/** Live `:free` model ids. */
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
