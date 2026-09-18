import OpenAI from "openai";
import { createHash } from "crypto";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export function hashInput(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

/**
 * Calls the Chat Completions API in strict JSON mode and parses the result.
 * Centralizing this means every AI feature gets consistent error handling,
 * model selection, and (via callers using `AIGeneration.inputHash`) caching.
 */
export async function completeJSON<T>(params: {
  system: string;
  user: string;
  model?: string;
}): Promise<{ data: T; promptTokens: number; completionTokens: number; raw: string }> {
  const model = params.model ?? "gpt-4o-mini";

  const response = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.3,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  let data: T;
  try {
    data = JSON.parse(raw) as T;
  } catch {
    throw new Error("AI service returned malformed JSON. Please retry.");
  }

  return {
    data,
    raw,
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
  };
}

export async function completeText(params: { system: string; user: string; model?: string }) {
  const model = params.model ?? "gpt-4o-mini";
  const response = await openai.chat.completions.create({
    model,
    temperature: 0.6,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
  });
  return {
    text: response.choices[0]?.message?.content ?? "",
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
  };
}
