import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listApplicationsAction,
  createApplicationAction,
  updateApplicationStatusAction,
  deleteApplicationAction,
} from "@/features/jobs/actions";
import type { CreateApplicationInput } from "@/features/jobs/schemas";
import type { JobApplicationListItem } from "@/repositories/application.repository";
import type { ApplicationStatus } from "@prisma/client";

const APPLICATIONS_KEY = ["applications"] as const;

export function useApplications() {
  return useQuery({
    queryKey: APPLICATIONS_KEY,
    queryFn: async () => {
      const result = await listApplicationsAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      const result = await createApplicationAction(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY }),
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const result = await updateApplicationStatusAction(id, status);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    // Optimistic update so dragging a Kanban card feels instant.
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: APPLICATIONS_KEY });
      const previous = queryClient.getQueryData<JobApplicationListItem[]>(APPLICATIONS_KEY);

      queryClient.setQueryData<JobApplicationListItem[]>(APPLICATIONS_KEY, (old) =>
        old?.map((app) => (app.id === id ? { ...app, status } : app))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(APPLICATIONS_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY }),
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteApplicationAction(id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY }),
  });
}
