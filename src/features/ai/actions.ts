"use server";

import { requireUser } from "@/lib/rbac";
import { resumeRepository } from "@/repositories/resume.repository";
import { applicationRepository } from "@/repositories/application.repository";
import { completeText, completeJSON } from "@/lib/openai";
import { getCachedOrGenerate } from "@/features/ai/cache";
import {
  coverLetterInputSchema,
  interviewQuestionsInputSchema,
  jobMatchInputSchema,
  interviewQuestionsResultSchema,
  jobMatchResultSchema,
  type CoverLetterInput,
  type InterviewQuestionsInput,
  type JobMatchInput,
} from "@/features/ai/schemas";
import type { ActionResult } from "@/types/action-result";
import type { z } from "zod";

// ---------------------------------------------------------------------------
// Cover Letter
// ---------------------------------------------------------------------------

export async function generateCoverLetterAction(input: CoverLetterInput): Promise<ActionResult<{ letter: string }>> {
  const user = await requireUser();
  const parsed = coverLetterInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };

  const resume = await resumeRepository.findById(parsed.data.resumeId, user.id);
  if (!resume?.rawText) return { success: false, error: "Resume not found or not yet parsed." };

  try {
    const letter = await getCachedOrGenerate({
      userId: user.id,
      resumeId: resume.id,
      type: "COVER_LETTER",
      input: parsed.data,
      generate: async () => {
        const { text, promptTokens, completionTokens } = await completeText({
          system: `You are an expert career coach writing tailored, ATS-friendly cover
letters. Write in a ${parsed.data.tone} tone. Keep it to 3-4 paragraphs. Do not
invent experience not present in the resume. Address it generically ("Dear
Hiring Team") unless a hiring manager's name is present in the job description.`,
          user: `CANDIDATE RESUME:\n${resume.rawText!.slice(0, 6000)}\n\nJOB TITLE: ${parsed.data.jobTitle}\nCOMPANY: ${parsed.data.companyName}\nJOB DESCRIPTION:\n${parsed.data.jobDescription.slice(0, 3000)}`,
        });
        return {
          result: text,
          promptForLog: `cover-letter:${parsed.data.jobTitle}@${parsed.data.companyName}`,
          responseForLog: JSON.stringify(text),
          promptTokens,
          completionTokens,
        };
      },
    });

    return { success: true, data: { letter } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Cover letter generation failed." };
  }
}

// ---------------------------------------------------------------------------
// Interview Questions
// ---------------------------------------------------------------------------

type InterviewQuestionsResult = z.infer<typeof interviewQuestionsResultSchema>;

export async function generateInterviewQuestionsAction(
  input: InterviewQuestionsInput
): Promise<ActionResult<InterviewQuestionsResult>> {
  const user = await requireUser();
  const parsed = interviewQuestionsInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };

  try {
    const result = await getCachedOrGenerate({
      userId: user.id,
      resumeId: parsed.data.resumeId,
      type: "INTERVIEW_QUESTIONS",
      input: parsed.data,
      generate: async () => {
        const { data, promptTokens, completionTokens } = await completeJSON<InterviewQuestionsResult>({
          system: `Generate likely interview questions for this role. Return ONLY JSON:
{ "behavioral": string[] (5 items), "technical": string[] (6 items), "companySpecific": string[] (4 items) }`,
          user: `JOB TITLE: ${parsed.data.jobTitle}\nJOB DESCRIPTION:\n${parsed.data.jobDescription.slice(0, 3000)}`,
        });

        const validated = interviewQuestionsResultSchema.parse(data);
        return {
          result: validated,
          promptForLog: `interview-qs:${parsed.data.jobTitle}`,
          responseForLog: JSON.stringify(validated),
          promptTokens,
          completionTokens,
        };
      },
    });

    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Question generation failed." };
  }
}

// ---------------------------------------------------------------------------
// Job Match Score
// ---------------------------------------------------------------------------

type JobMatchResult = z.infer<typeof jobMatchResultSchema>;

export async function computeJobMatchAction(
  input: JobMatchInput,
  applicationId?: string
): Promise<ActionResult<JobMatchResult>> {
  const user = await requireUser();
  const parsed = jobMatchInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };

  const resume = await resumeRepository.findById(parsed.data.resumeId, user.id);
  if (!resume?.rawText) return { success: false, error: "Resume not found or not yet parsed." };

  try {
    const result = await getCachedOrGenerate({
      userId: user.id,
      resumeId: resume.id,
      type: "JOB_MATCH",
      input: parsed.data,
      generate: async () => {
        const { data, promptTokens, completionTokens } = await completeJSON<JobMatchResult>({
          system: `Score how well this resume matches this job on a 0-100 scale. Return ONLY JSON:
{ "score": number, "strengths": string[] (3-5 items), "gaps": string[] (3-5 items), "recommendation": string (1-2 sentences) }`,
          user: `RESUME:\n${resume.rawText!.slice(0, 6000)}\n\nJOB DESCRIPTION:\n${parsed.data.jobDescription.slice(0, 3000)}`,
        });

        const validated = jobMatchResultSchema.parse(data);
        return {
          result: validated,
          promptForLog: `job-match:${resume.id}`,
          responseForLog: JSON.stringify(validated),
          promptTokens,
          completionTokens,
        };
      },
    });

    if (applicationId) {
      await applicationRepository.updateMatchScore(applicationId, result.score);
    }

    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Job match scoring failed." };
  }
}
