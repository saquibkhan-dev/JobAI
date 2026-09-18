"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { applicationRepository, type JobApplicationListItem } from "@/repositories/application.repository";
import { createApplicationSchema, updateApplicationStatusSchema, type CreateApplicationInput } from "@/features/jobs/schemas";
import { scheduleInterviewReminder } from "@/features/notifications/scheduler";
import type { ActionResult } from "@/types/action-result";
import type { ApplicationStatus, JobApplication } from "@prisma/client";

export async function createApplicationAction(input: CreateApplicationInput): Promise<ActionResult<JobApplication>> {
  const user = await requireUser();
  const parsed = createApplicationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };

  const application = await applicationRepository.create(user.id, {
    ...parsed.data,
    jobUrl: parsed.data.jobUrl || undefined,
  });

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return { success: true, data: application };
}

export async function updateApplicationStatusAction(
  id: string,
  status: ApplicationStatus
): Promise<ActionResult<JobApplication>> {
  const user = await requireUser();
  const parsed = updateApplicationStatusSchema.safeParse({ id, status });
  if (!parsed.success) return { success: false, error: "Invalid status update." };

  const updated = await applicationRepository.updateStatus(parsed.data.id, user.id, parsed.data.status);
  if (!updated) return { success: false, error: "Application not found." };

  // NOTE: the repository currently stamps `interviewAt` with "now" the
  // moment a card is dragged to INTERVIEW, which is a placeholder — in a
  // real build, dragging to INTERVIEW should open a small date/time picker
  // (see CreateApplicationDialog for the RHF+Zod pattern to copy) so
  // `interviewAt` reflects the actual scheduled time before this reminder
  // is computed. Left as-is here since the reminder math (T-24h) is what
  // matters for the pattern; wire the date picker before shipping.
  if (updated.status === "INTERVIEW" && updated.interviewAt) {
    await scheduleInterviewReminder({
      userId: user.id,
      applicationId: updated.id,
      interviewAt: updated.interviewAt,
    });
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return { success: true, data: updated };
}

export async function deleteApplicationAction(id: string): Promise<ActionResult<null>> {
  const user = await requireUser();
  await applicationRepository.delete(id, user.id);
  revalidatePath("/jobs");
  return { success: true, data: null };
}

export async function listApplicationsAction(): Promise<ActionResult<JobApplicationListItem[]>> {
  const user = await requireUser();
  const applications = await applicationRepository.listByUser(user.id);
  return { success: true, data: applications };
}
