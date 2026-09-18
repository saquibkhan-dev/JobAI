import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadResumeAction, deleteResumeAction, parseResumeAction } from "@/features/resume/actions";

const RESUMES_KEY = "resumes" as const;

async function fetchResumes(search: string, page: number) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  const res = await fetch(`/api/resumes?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load resumes.");
  return res.json() as Promise<{ resumes: unknown[]; hasMore: boolean }>;
}

export function useResumes(search: string, page: number) {
  return useQuery({
    queryKey: [RESUMES_KEY, search, page],
    queryFn: () => fetchResumes(search, page),
    staleTime: 15_000,
    placeholderData: (previous) => previous, // keep old page visible while the next loads
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadResumeAction(formData);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [RESUMES_KEY] }),
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteResumeAction(id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [RESUMES_KEY] }),
  });
}

export function useReparseResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await parseResumeAction(id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [RESUMES_KEY] }),
  });
}
