"use client";

import dynamic from "next/dynamic";
import { useDashboardAnalytics } from "@/hooks/useDashboard";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

// Recharts (~90KB+ gzipped) is only needed once analytics data exists, and
// only on this one page — code-split it out of the main dashboard bundle
// instead of shipping it to every route that imports this file's siblings.
const AtsTrendChart = dynamic(
  () => import("@/features/dashboard/components/AtsTrendChart").then((m) => m.AtsTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-[240px] w-full" /> }
);
const WeeklyActivityChart = dynamic(
  () => import("@/features/dashboard/components/WeeklyActivityChart").then((m) => m.WeeklyActivityChart),
  { ssr: false, loading: () => <Skeleton className="h-[240px] w-full" /> }
);

export function DashboardClient() {
  const { data, isLoading, isError } = useDashboardAnalytics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState title="Couldn't load your dashboard" description="Please refresh the page to try again." />;
  }

  const latestAtsScore = data.atsTrend.at(-1)?.score ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Applications" value={data.totalApplications} />
        <StatCard label="Interviews Scheduled" value={data.statusCounts.INTERVIEW ?? 0} />
        <StatCard label="Offers Received" value={data.statusCounts.OFFER ?? 0} />
        <StatCard label="Latest ATS Score" value={latestAtsScore !== null ? `${latestAtsScore}/100` : "—"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">ATS Score Trend</h3>
          {data.atsTrend.length === 0 ? (
            <EmptyState title="No ATS analyses yet" description="Run an ATS analysis on a resume to see your trend." compact />
          ) : (
            <AtsTrendChart data={data.atsTrend} />
          )}
        </div>

        <div className="rounded-xl border p-4">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Weekly Activity</h3>
          <WeeklyActivityChart data={data.weeklyActivity} />
        </div>
      </div>
    </div>
  );
}
