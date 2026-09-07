import type { ChatMessage, ChatResult } from "./types";

// Google's own API. Tried ahead of OpenRouter when a key is set, because
// OpenRouter's free tier allows only 50 calls a day for the whole account.

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Measured fastest of the flash models: 6/6 valid replies, ~0.9s median.
// `thinkingConfig` is rejected by this model, so it is not sent.
const DEFAULT_MODEL = "gemini-flash-lite-latest";

/** Forces the reply into the grading shape, so a JSON repair pass is rarely needed. */
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    correct: { type: "BOOLEAN" },
    correctedAnswer: { type: "STRING" },
    explanation: { type: "STRING" },
  },
  required: ["correct", "correctedAnswer", "explanation"],
};

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly kind: "config" | "timeout" | "http" | "empty" = "http",
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export const hasGemini = (): boolean => Boolean(process.env.GEMINI_API_KEY?.trim());

/** `GEMINI_MODEL` overrides the default. */
export const geminiModel = (): string => process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

export type GeminiOptions = { timeoutMs: number; maxTokens?: number; temperature?: number };

export async function geminiCompletion(messages: ChatMessage[], opts: GeminiOptions): Promise<ChatResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiError("GEMINI_API_KEY is not set", "config");

  const model = geminiModel();
  // Gemini takes the system turn separately and calls the assistant role "model".
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents,
        generationConfig: {
          temperature: opts.temperature ?? 0.2,
          maxOutputTokens: opts.maxTokens ?? 600,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new GeminiError(`Gemini HTTP ${res.status}: ${text.slice(0, 200)}`, "http");
    }

    const data = (await res.json()) as {
      modelVersion?: string;
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const content = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    if (!content.trim()) throw new GeminiError(`Gemini: ${model} returned no content`, "empty");

    return { content, model: data.modelVersion ?? model };
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new GeminiError(`Gemini timed out after ${opts.timeoutMs}ms`, "timeout");
    }
    throw new GeminiError(err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timer);
  }
}
