import { create } from "zustand";
import type { ApplicationStatus } from "@prisma/client";

interface JobBoardState {
  /** id of the card currently being dragged, for optimistic column highlighting */
  draggingId: string | null;
  /** which column is being hovered as a drop target */
  hoveredColumn: ApplicationStatus | null;
  isCreateModalOpen: boolean;

  setDragging: (id: string | null) => void;
  setHoveredColumn: (status: ApplicationStatus | null) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
}

/**
 * Zustand owns only ephemeral, client-local UI state for the Kanban board.
 * The actual application data lives in React Query's cache (useApplications)
 * — this store never duplicates server data, which avoids the two caches
 * drifting out of sync.
 */
export const useJobBoardStore = create<JobBoardState>((set) => ({
  draggingId: null,
  hoveredColumn: null,
  isCreateModalOpen: false,

  setDragging: (id) => set({ draggingId: id }),
  setHoveredColumn: (status) => set({ hoveredColumn: status }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
}));
