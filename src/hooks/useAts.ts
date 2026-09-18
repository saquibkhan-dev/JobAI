import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runAtsAnalysisAction } from "@/features/ats/actions";

export function useRunAtsAnalysis(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobDescription?: string) => {
      const result = await runAtsAnalysisAction(resumeId, jobDescription);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}
