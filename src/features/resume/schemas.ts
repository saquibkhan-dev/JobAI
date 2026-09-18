import { z } from "zod";

export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
] as const;

export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const resumeUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= MAX_RESUME_SIZE_BYTES, "File must be 5MB or smaller.")
    .refine(
      (f) => ALLOWED_RESUME_TYPES.includes(f.type as (typeof ALLOWED_RESUME_TYPES)[number]),
      "Only PDF and DOCX files are supported."
    ),
});

// Shape the LLM is instructed to return — validated before being persisted so
// a malformed / hallucinated extraction never corrupts the database.
export const parsedResumeSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experiences: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string().optional(),
        field: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        technologies: z.array(z.string()).default([]),
        url: z.string().optional(),
      })
    )
    .default([]),
});
export type ParsedResume = z.infer<typeof parsedResumeSchema>;
