import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  FileUp,
  ThumbsDown,
  ThumbsUp,
  Users,
  XCircle,
} from "lucide-react";
import Navbar from "../components/navbar/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import BarChartCard from "../components/charts/BarChartCard.jsx";
import PieChartCard from "../components/charts/PieChartCard.jsx";
import RecentActivity from "../components/dashboard/RecentActivity.jsx";
import { ChartSkeleton, MetricSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { fetchDashboardMetrics } from "../services/dashboardService.js";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <div>
      <Navbar
        title="Dashboard"
        subtitle="Hiring analytics and resume processing overview"
      />

      <div className="space-y-6 p-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <MetricSkeleton key={i} />)
          ) : (
            <>
              <MetricCard label="Total Uploaded" value={metrics.total_uploaded} icon={FileUp} />
              <MetricCard
                label="Successfully Parsed"
                value={metrics.successfully_parsed}
                icon={CheckCircle2}
                accent="emerald"
              />
              <MetricCard
                label="Failed Parsing"
                value={metrics.failed_parsing}
                icon={XCircle}
                accent="red"
              />
              <MetricCard
                label="Shortlisted"
                value={metrics.shortlisted}
                icon={ThumbsUp}
                accent="emerald"
              />
              <MetricCard
                label="Rejected"
                value={metrics.rejected}
                icon={ThumbsDown}
                accent="red"
              />
              <MetricCard
                label="Interview Scheduled"
                value={metrics.interview_scheduled}
                icon={CalendarCheck}
                accent="violet"
              />
              <MetricCard
                label="Active Recruiters"
                value={metrics.active_recruiters}
                icon={Users}
                accent="amber"
              />
              <MetricCard
                label="Open Roles"
                value={
                  new Set(
                    metrics.recent_uploads
                      .map((u) => u.position_applied)
                      .filter(Boolean),
                  ).size
                }
                icon={Briefcase}
                accent="slate"
              />
            </>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            {loading ? (
              <ChartSkeleton />
            ) : (
              <BarChartCard
                title="Recent Upload Activity"
                data={metrics.uploads_by_day}
                dataKey="count"
                labelKey="label"
              />
            )}
          </div>
          <div>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <PieChartCard
                title="Candidate Status Distribution"
                data={metrics.status_distribution}
              />
            )}
          </div>
        </div>

        {!loading && <RecentActivity uploads={metrics.recent_uploads} />}
      </div>
    </div>
  );
}
