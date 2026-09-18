"use client";

import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { JobApplicationListItem } from "@/repositories/application.repository";
import { cn } from "@/lib/utils";

function KanbanCardImpl({ application }: { application: JobApplicationListItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab rounded-lg border bg-background p-3 shadow-sm active:cursor-grabbing",
        isDragging && "z-10 opacity-70 shadow-lg"
      )}
    >
      <p className="text-sm font-medium">{application.jobTitle}</p>
      <p className="text-xs text-muted-foreground">{application.companyName}</p>
      {application.matchScore !== null && (
        <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {application.matchScore}% match
        </span>
      )}
    </div>
  );
}

// The board re-renders on every drag-frame update (KanbanBoard tracks
// draggingId in Zustand). Without memo, every card in every column would
// re-render on each frame even though only the dragged card's transform
// actually changes — this keeps that cost to O(1) instead of O(n).
export const KanbanCard = memo(KanbanCardImpl, (prev, next) => {
  const a = prev.application;
  const b = next.application;
  return a.id === b.id && a.status === b.status && a.matchScore === b.matchScore && a.jobTitle === b.jobTitle && a.companyName === b.companyName;
});
