"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { resumeRepository } from "@/repositories/resume.repository";
import { atsRepository } from "@/repositories/ats.repository";
import { runAtsAnalysis } from "@/features/ats/analyzer";
import type { ActionResult } from "@/types/action-result";
import type { AtsAnalysis } from "@prisma/client";

export async function runAtsAnalysisAction(
  resumeId: string,
  jobDescription?: string
): Promise<ActionResult<AtsAnalysis>> {
  const user = await requireUser();
  const resume = await resumeRepository.findById(resumeId, user.id);

  if (!resume) return { success: false, error: "Resume not found." };
  if (resume.status !== "PARSED" || !resume.rawText) {
    return { success: false, error: "Resume must finish parsing before it can be analyzed." };
  }

  try {
    const result = await runAtsAnalysis(resume.rawText, jobDescription);
    const analysis = await atsRepository.create(resumeId, { jobDescription, ...result });

    revalidatePath(`/resumes/${resumeId}`);
    revalidatePath("/dashboard");
    return { success: true, data: analysis };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "ATS analysis failed." };
  }
}
