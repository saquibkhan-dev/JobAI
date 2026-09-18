import { z } from "zod";

export const coverLetterInputSchema = z.object({
  resumeId: z.string().cuid(),
  jobTitle: z.string().min(2),
  companyName: z.string().min(1),
  jobDescription: z.string().min(20, "Paste the full job description for best results."),
  tone: z.enum(["professional", "enthusiastic", "concise"]).default("professional"),
});
export type CoverLetterInput = z.infer<typeof coverLetterInputSchema>;

export const interviewQuestionsInputSchema = z.object({
  jobTitle: z.string().min(2),
  jobDescription: z.string().min(20),
  resumeId: z.string().cuid().optional(),
});
export type InterviewQuestionsInput = z.infer<typeof interviewQuestionsInputSchema>;

export const jobMatchInputSchema = z.object({
  resumeId: z.string().cuid(),
  jobDescription: z.string().min(20),
});
export type JobMatchInput = z.infer<typeof jobMatchInputSchema>;

export const interviewQuestionsResultSchema = z.object({
  behavioral: z.array(z.string()),
  technical: z.array(z.string()),
  companySpecific: z.array(z.string()),
});

export const jobMatchResultSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendation: z.string(),
});
