import { completeJSON } from "@/lib/openai";
import { parsedResumeSchema, type ParsedResume } from "@/features/resume/schemas";

const SYSTEM_PROMPT = `You are a precise resume-parsing engine used inside an ATS product.
Extract structured data from the resume text the user provides.
Rules:
- Return ONLY valid JSON matching the schema described below. No commentary.
- If a field is not present in the resume, omit it (do not invent data).
- "skills" should be a flat, deduplicated list of individual skills/technologies.
- Dates should be copied as they appear in the resume (free text is fine).
- Order "experiences" and "education" from most recent to oldest.

JSON schema:
{
  "fullName": string,
  "email": string,
  "phone": string,
  "summary": string,
  "skills": string[],
  "experiences": [{ "company": string, "title": string, "startDate": string, "endDate": string, "description": string }],
  "education": [{ "institution": string, "degree": string, "field": string, "startDate": string, "endDate": string }],
  "projects": [{ "name": string, "description": string, "technologies": string[], "url": string }]
}`;

/**
 * Sends extracted resume text to the LLM and returns validated structured
 * data. Truncates extremely long resumes to control token cost while still
 * capturing the vast majority of real-world resume lengths.
 */
export async function parseResumeText(rawText: string): Promise<ParsedResume> {
  const truncated = rawText.slice(0, 12_000);

  const { data } = await completeJSON<unknown>({
    system: SYSTEM_PROMPT,
    user: truncated,
  });

  const result = parsedResumeSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Resume parsing produced an unexpected shape. Please try re-uploading.");
  }

  return result.data;
}
