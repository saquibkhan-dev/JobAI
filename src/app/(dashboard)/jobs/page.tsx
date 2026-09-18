import type { Metadata } from "next";
import { KanbanBoard } from "@/features/jobs/components/KanbanBoard";

export const metadata: Metadata = {
  title: "Job Tracker | JobAI",
  description: "Track every application from wishlist to offer.",
};

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Job Tracker</h1>
        <p className="text-muted-foreground">Drag cards between stages as your applications progress.</p>
      </div>
      <KanbanBoard />
    </div>
  );
}
