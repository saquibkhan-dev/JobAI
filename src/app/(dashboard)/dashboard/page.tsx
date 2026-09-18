import type { Metadata } from "next";
import { DashboardClient } from "@/features/dashboard/components/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | JobAI",
  description: "Track your job search progress, ATS scores, and weekly activity.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your job search, at a glance.</p>
      </div>
      <DashboardClient />
    </div>
  );
}
