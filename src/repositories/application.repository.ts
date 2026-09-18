import { db } from "@/lib/db";
import type { ApplicationStatus, Prisma } from "@prisma/client";

const applicationListSelect = {
  id: true,
  companyName: true,
  jobTitle: true,
  jobUrl: true,
  location: true,
  status: true,
  matchScore: true,
  notes: true,
  appliedAt: true,
  interviewAt: true,
  createdAt: true,
  updatedAt: true,
  resumeId: true,
  userId: true,
  resume: { select: { fileName: true } },
} satisfies Prisma.JobApplicationSelect;

export type JobApplicationListItem = Prisma.JobApplicationGetPayload<{ select: typeof applicationListSelect }>;

export const applicationRepository = {
  async create(
    userId: string,
    data: {
      companyName: string;
      jobTitle: string;
      jobDescription?: string;
      jobUrl?: string;
      location?: string;
      resumeId?: string;
    }
  ) {
    return db.$transaction(async (tx) => {
      const application = await tx.jobApplication.create({
        data: { userId, ...data, status: "WISHLIST" },
      });
      await tx.applicationStatusEvent.create({
        data: { applicationId: application.id, toStatus: "WISHLIST" },
      });
      return application;
    });
  },

  async listByUser(userId: string): Promise<JobApplicationListItem[]> {
    // Selected fields only — the Kanban board never needs jobDescription
    // (which can run several KB per row); trimming it here materially
    // shrinks the payload once someone has 50+ applications.
    return db.jobApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: applicationListSelect,
    });
  },

  async findById(id: string, userId: string) {
    return db.jobApplication.findFirst({ where: { id, userId } });
  },

  async updateStatus(id: string, userId: string, toStatus: ApplicationStatus) {
    const existing = await db.jobApplication.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return db.$transaction(async (tx) => {
      const updated = await tx.jobApplication.update({
        where: { id },
        data: {
          status: toStatus,
          appliedAt: toStatus === "APPLIED" ? new Date() : existing.appliedAt,
          interviewAt: toStatus === "INTERVIEW" ? new Date() : existing.interviewAt,
        },
      });
      await tx.applicationStatusEvent.create({
        data: { applicationId: id, fromStatus: existing.status, toStatus },
      });
      return updated;
    });
  },

  async updateMatchScore(id: string, matchScore: number) {
    return db.jobApplication.update({ where: { id }, data: { matchScore } });
  },

  async delete(id: string, userId: string) {
    return db.jobApplication.deleteMany({ where: { id, userId } });
  },

  /** Weekly activity: count of status-change events per day, last 7 days. */
  async getRecentStatusEvents(userId: string, since: Date) {
    return db.applicationStatusEvent.findMany({
      where: { application: { userId }, changedAt: { gte: since } },
      select: { toStatus: true, changedAt: true },
      orderBy: { changedAt: "asc" },
    });
  },

  async countByStatus(userId: string) {
    const rows = await db.jobApplication.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    });
    return rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count._all;
      return acc;
    }, {});
  },
};
