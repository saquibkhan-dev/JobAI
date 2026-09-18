import { useQuery } from "@tanstack/react-query";
import { getDashboardAnalyticsAction } from "@/features/dashboard/actions";

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: async () => {
      const result = await getDashboardAnalyticsAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60_000,
  });
}
