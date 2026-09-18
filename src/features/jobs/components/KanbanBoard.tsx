"use client";

import { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useApplications, useUpdateApplicationStatus } from "@/hooks/useApplications";
import { useJobBoardStore } from "@/store/useJobBoardStore";
import { KanbanColumn } from "@/features/jobs/components/KanbanColumn";
import { CreateApplicationDialog } from "@/features/jobs/components/CreateApplicationDialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApplicationStatus } from "@prisma/client";
import type { JobApplicationListItem } from "@/repositories/application.repository";

const COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: "WISHLIST", label: "Wishlist" },
  { status: "APPLIED", label: "Applied" },
  { status: "INTERVIEW", label: "Interview" },
  { status: "OFFER", label: "Offer" },
  { status: "REJECTED", label: "Rejected" },
];

export function KanbanBoard() {
  const { data: applications, isLoading } = useApplications();
  const updateStatus = useUpdateApplicationStatus();
  const setDragging = useJobBoardStore((s) => s.setDragging);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const grouped = useMemo(() => {
    const map: Record<ApplicationStatus, JobApplicationListItem[]> = {
      WISHLIST: [],
      APPLIED: [],
      INTERVIEW: [],
      OFFER: [],
      REJECTED: [],
    };
    for (const app of applications ?? []) map[app.status].push(app);
    return map;
  }, [applications]);

  function handleDragStart(event: DragStartEvent) {
    setDragging(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null);
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as ApplicationStatus;
    const application = applications?.find((a) => a.id === active.id);
    if (!application || application.status === newStatus) return;

    updateStatus.mutate({ id: application.id, status: newStatus });
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {COLUMNS.map((c) => (
          <Skeleton key={c.status} className="h-96 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateApplicationDialog />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {COLUMNS.map(({ status, label }) => (
            <KanbanColumn key={status} status={status} label={label} applications={grouped[status]} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
