import api from "./api.js";

export async function fetchDashboardMetrics() {
  const { data } = await api.get("/dashboard/metrics");
  return data.metrics;
}
