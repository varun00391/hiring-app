"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { api } from "@/lib/api";
import type { TagPerformanceRow } from "@/types/hirebot";

export default function RecruitersPage() {
  const { data: perf } = useQuery({
    queryKey: ["recruiters-performance"],
    queryFn: async () => {
      const { data } = await api.get<TagPerformanceRow[]>("/recruiters/performance");
      return data;
    },
  });

  return <DashboardClient variant="recruiters" metrics={[]} performanceRows={perf ?? []} />;
}
