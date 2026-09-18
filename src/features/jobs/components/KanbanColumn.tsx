"use client";

import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "@/features/jobs/components/KanbanCard";
import type { ApplicationStatus } from "@prisma/client";
import type { JobApplicationListItem } from "@/repositories/application.repository";
import { cn } from "@/lib/utils";

export function KanbanColumn({
  status,
  label,
  applications,
}: {
  status: ApplicationStatus;
  label: string;
  applications: JobApplicationListItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[24rem] flex-col rounded-xl border bg-muted/20 p-3 transition-colors",
        isOver && "border-primary bg-primary/5"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {applications.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {applications.map((app) => (
          <KanbanCard key={app.id} application={app} />
        ))}
      </div>
    </div>
  );
}
