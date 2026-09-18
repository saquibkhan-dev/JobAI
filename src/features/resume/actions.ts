"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { resumeRepository } from "@/repositories/resume.repository";
import { uploadResumeFile, downloadResumeBuffer, deleteResumeFile } from "@/lib/storage";
import { extractResumeText } from "@/features/resume/text-extractor";
import { parseResumeText } from "@/features/resume/parser";
import { resumeUploadSchema } from "@/features/resume/schemas";
import type { ActionResult } from "@/types/action-result";

export async function uploadResumeAction(formData: FormData): Promise<ActionResult<{ resumeId: string }>> {
  const user = await requireUser();

  const file = formData.get("file");
  const parsed = resumeUploadSchema.safeParse({ file });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid file." };
  }

  try {
    const path = await uploadResumeFile(user.id, parsed.data.file);
    const resume = await resumeRepository.create(user.id, {
      fileName: parsed.data.file.name,
      fileUrl: path,
      fileType: parsed.data.file.type,
    });

    // Kick off parsing async — UI polls/subscribes for status via React Query.
    void parseResumeAction(resume.id);

    revalidatePath("/resumes");
    return { success: true, data: { resumeId: resume.id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Upload failed." };
  }
}

export async function parseResumeAction(resumeId: string): Promise<ActionResult<{ resumeId: string }>> {
  const user = await requireUser();
  const resume = await resumeRepository.findById(resumeId, user.id);
  if (!resume) return { success: false, error: "Resume not found." };

  try {
    await resumeRepository.updateStatus(resumeId, "PARSING");

    const buffer = await downloadResumeBuffer(resume.fileUrl);
    const rawText = await extractResumeText(buffer, resume.fileType);

    if (rawText.trim().length < 50) {
      throw new Error("Could not extract readable text from this file. Try a different export.");
    }

    const parsed = await parseResumeText(rawText);

    await resumeRepository.saveParsedData(resumeId, {
      ...parsed,
      rawText,
      experiences: parsed.experiences.map((e, i) => ({ ...e, order: i })),
      education: parsed.education.map((e, i) => ({ ...e, order: i })),
      projects: parsed.projects.map((p, i) => ({ ...p, order: i })),
    });

    revalidatePath("/resumes");
    revalidatePath(`/resumes/${resumeId}`);
    return { success: true, data: { resumeId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resume parsing failed.";
    await resumeRepository.updateStatus(resumeId, "FAILED", message);
    return { success: false, error: message };
  }
}

export async function deleteResumeAction(resumeId: string): Promise<ActionResult<null>> {
  const user = await requireUser();
  const resume = await resumeRepository.findById(resumeId, user.id);
  if (!resume) return { success: false, error: "Resume not found." };

  await deleteResumeFile(resume.fileUrl);
  await resumeRepository.delete(resumeId, user.id);

  revalidatePath("/resumes");
  return { success: true, data: null };
}
