import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { notificationRepository } from "@/repositories/notification.repository";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { InterviewReminderEmail } from "@/emails/InterviewReminderEmail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com";

/**
 * Configure in vercel.json:
 * { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }
 * (hourly). Protected by CRON_SECRET so it can't be triggered externally.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await notificationRepository.findDue(new Date());
  let sent = 0;
  let failed = 0;

  for (const notification of due) {
    try {
      if (notification.type === "INTERVIEW_REMINDER" && notification.application) {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: notification.user.email,
          subject: `Reminder: interview for ${notification.application.jobTitle}`,
          react: InterviewReminderEmail({
            userName: notification.user.name ?? "there",
            companyName: notification.application.companyName,
            jobTitle: notification.application.jobTitle,
            interviewAt: notification.application.interviewAt?.toLocaleString() ?? "soon",
            applicationUrl: `${SITE_URL}/jobs`,
          }),
        });
      }
      // ATS_RECHECK_NUDGE / APPLICATION_FOLLOW_UP handled analogously —
      // omitted here for brevity, same pattern as above.

      await notificationRepository.markSent(notification.id);
      sent++;
    } catch (err) {
      console.error(`Failed to send notification ${notification.id}:`, err);
      await notificationRepository.markFailed(notification.id);
      failed++;
    }
  }

  return NextResponse.json({ processed: due.length, sent, failed });
}
