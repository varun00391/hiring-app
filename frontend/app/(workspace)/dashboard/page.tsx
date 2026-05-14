"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { api } from "@/lib/api";
import type { DashboardMetric, PipelineStageRow } from "@/types/hirebot";

type PipelineApi = {
  stages: PipelineStageRow[];
  total: number;
};

export default function DashboardPage() {
  const { data: metricsRes } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const { data } = await api.get<{ metrics: DashboardMetric[] }>("/dashboard/metrics");
      return data.metrics;
    },
  });

  const { data: pipeline } = useQuery({
    queryKey: ["pipeline-distribution"],
    queryFn: async () => {
      const { data } = await api.get<PipelineApi>("/analytics/pipeline");
      return data;
    },
  });

  return (
    <DashboardClient
      variant="dashboard"
      metrics={metricsRes}
      performanceRows={[]}
      pipeline={pipeline ?? null}
    />
  );
}
