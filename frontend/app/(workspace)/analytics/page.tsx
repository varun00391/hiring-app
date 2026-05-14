"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { api } from "@/lib/api";
import type { PipelineStageRow, TagPerformanceRow } from "@/types/hirebot";

type PipelineApi = {
  stages: PipelineStageRow[];
  total: number;
};

export default function AnalyticsPage() {
  const { data: pipeline } = useQuery({
    queryKey: ["pipeline-distribution"],
    queryFn: async () => {
      const { data } = await api.get<PipelineApi>("/analytics/pipeline");
      return data;
    },
  });

  const { data: perf } = useQuery({
    queryKey: ["recruiters-performance"],
    queryFn: async () => {
      const { data } = await api.get<TagPerformanceRow[]>("/recruiters/performance");
      return data;
    },
  });

  return (
    <DashboardClient
      variant="analytics"
      pipeline={pipeline ?? null}
      performanceRows={perf ?? []}
    />
  );
}
