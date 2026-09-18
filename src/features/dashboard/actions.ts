"use server";

import { requireUser } from "@/lib/rbac";
import { applicationRepository } from "@/repositories/application.repository";
import { atsRepository } from "@/repositories/ats.repository";
import type { ActionResult } from "@/types/action-result";
import type { ApplicationStatus } from "@prisma/client";

export interface DashboardAnalytics {
  totalApplications: number;
  statusCounts: Record<string, number>;
  atsTrend: { date: string; score: number }[];
  weeklyActivity: { day: string; count: number }[];
}

export async function getDashboardAnalyticsAction(): Promise<ActionResult<DashboardAnalytics>> {
  const user = await requireUser();

  const [statusCounts, atsTrendRaw, recentEvents] = await Promise.all([
    applicationRepository.countByStatus(user.id),
    atsRepository.getTrendForUser(user.id),
    applicationRepository.getRecentStatusEvents(user.id, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
  ]);

  const totalApplications = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

  const atsTrend = atsTrendRaw.map((a) => ({
    date: a.createdAt.toISOString().slice(0, 10),
    score: a.score,
  }));

  // Bucket status-change events into the last 7 calendar days for the
  // "weekly activity" bar chart.
  const dayBuckets = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayBuckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const event of recentEvents) {
    const key = event.changedAt.toISOString().slice(0, 10);
    if (dayBuckets.has(key)) dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }

  const weeklyActivity = [...dayBuckets.entries()].map(([day, count]) => ({ day, count }));

  return {
    success: true,
    data: {
      totalApplications,
      statusCounts: normalizeStatusCounts(statusCounts),
      atsTrend,
      weeklyActivity,
    },
  };
}

function normalizeStatusCounts(counts: Record<string, number>): Record<ApplicationStatus, number> {
  const statuses: ApplicationStatus[] = ["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"];
  return statuses.reduce((acc, status) => {
    acc[status] = counts[status] ?? 0;
    return acc;
  }, {} as Record<ApplicationStatus, number>);
}
