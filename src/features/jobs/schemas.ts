import { z } from "zod";

export const applicationStatusSchema = z.enum([
  "WISHLIST",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
]);

export const createApplicationSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().optional(),
  jobUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  location: z.string().optional(),
  resumeId: z.string().cuid().optional(),
});
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationStatusSchema = z.object({
  id: z.string().cuid(),
  status: applicationStatusSchema,
});
