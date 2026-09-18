import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export const notificationRepository = {
  async schedule(params: {
    userId: string;
    applicationId?: string;
    type: NotificationType;
    scheduledFor: Date;
    payload?: Record<string, unknown>;
  }) {
    return db.notification.create({ data: params });
  },

  /** Cron entry point: everything due and not yet sent. */
  async findDue(now: Date) {
    return db.notification.findMany({
      where: { sentAt: null, failedAt: null, scheduledFor: { lte: now } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        application: { select: { companyName: true, jobTitle: true, interviewAt: true } },
      },
      take: 100, // batch size per cron tick
    });
  },

  async markSent(id: string) {
    return db.notification.update({ where: { id }, data: { sentAt: new Date() } });
  },

  async markFailed(id: string) {
    return db.notification.update({ where: { id }, data: { failedAt: new Date() } });
  },
};
