import { db } from "@/lib/db";
import { hashInput } from "@/lib/openai";
import type { AIGenerationType } from "@prisma/client";

/**
 * Avoids re-billing OpenAI when a user re-opens a tool with the exact same
 * resume + job description pair. Keyed by (userId, type, sha256(input)),
 * matching the unique constraint on AIGeneration.
 */
export async function getCachedOrGenerate<T>(params: {
  userId: string;
  resumeId?: string;
  type: AIGenerationType;
  input: unknown;
  generate: () => Promise<{ result: T; promptForLog: string; responseForLog: string; promptTokens: number; completionTokens: number }>;
}): Promise<T> {
  const inputHash = hashInput(params.input);

  const cached = await db.aIGeneration.findUnique({
    where: { userId_type_inputHash: { userId: params.userId, type: params.type, inputHash } },
  });

  if (cached) {
    return JSON.parse(cached.response) as T;
  }

  const { result, promptForLog, responseForLog, promptTokens, completionTokens } = await params.generate();

  await db.aIGeneration.create({
    data: {
      userId: params.userId,
      resumeId: params.resumeId,
      type: params.type,
      inputHash,
      prompt: promptForLog,
      response: responseForLog,
      promptTokens,
      completionTokens,
    },
  });

  return result;
}
