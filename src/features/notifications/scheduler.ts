import { notificationRepository } from "@/repositories/notification.repository";

const REMINDER_LEAD_TIME_MS = 24 * 60 * 60 * 1000; // 24h before interview

/**
 * Call this whenever an application's status moves to INTERVIEW with a set
 * `interviewAt` date (wire it into `updateApplicationStatusAction` in
 * production; kept separate here so the job-tracker action stays focused).
 */
export async function scheduleInterviewReminder(params: {
  userId: string;
  applicationId: string;
  interviewAt: Date;
}) {
  const scheduledFor = new Date(params.interviewAt.getTime() - REMINDER_LEAD_TIME_MS);

  // Don't schedule reminders in the past (e.g. interview is <24h away already).
  if (scheduledFor <= new Date()) return null;

  return notificationRepository.schedule({
    userId: params.userId,
    applicationId: params.applicationId,
    type: "INTERVIEW_REMINDER",
    scheduledFor,
  });
}

export async function scheduleAtsRecheckNudge(userId: string, resumeId: string) {
  const scheduledFor = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return notificationRepository.schedule({
    userId,
    type: "ATS_RECHECK_NUDGE",
    scheduledFor,
    payload: { resumeId },
  });
}
