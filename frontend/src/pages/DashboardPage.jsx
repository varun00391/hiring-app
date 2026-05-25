import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
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
import ThemeToggle from "../components/common/ThemeToggle.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import AreaChartCard from "../components/charts/AreaChartCard.jsx";
import LineChartCard from "../components/charts/LineChartCard.jsx";
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

  const sparkline = metrics?.uploads_by_day?.map((d) => d.count) ?? [];

  return (
    <div>
      <Navbar
        title="Dashboard"
        subtitle="Hiring analytics and resume processing overview"
        actions={<ThemeToggle />}
      />

      <div className="space-y-8 p-6 lg:p-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700 shadow-sm dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
          >
            {error}
          </motion.div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <MetricSkeleton key={i} />)
          ) : (
            <>
              <MetricCard index={0} label="Total Uploaded" value={metrics.total_uploaded} icon={FileUp} sparklineData={sparkline} />
              <MetricCard index={1} label="Successfully Parsed" value={metrics.successfully_parsed} icon={CheckCircle2} accent="emerald" />
              <MetricCard index={2} label="Failed Parsing" value={metrics.failed_parsing} icon={XCircle} accent="red" />
              <MetricCard index={3} label="Shortlisted" value={metrics.shortlisted} icon={ThumbsUp} accent="emerald" />
              <MetricCard index={4} label="Rejected" value={metrics.rejected} icon={ThumbsDown} accent="red" />
              <MetricCard index={5} label="Interview Scheduled" value={metrics.interview_scheduled} icon={CalendarCheck} accent="violet" />
              <MetricCard index={6} label="Active Recruiters" value={metrics.active_recruiters} icon={Users} accent="cyan" />
              <MetricCard
                index={7}
                label="Open Roles"
                value={
                  new Set(
                    metrics.recent_uploads.map((u) => u.position_applied).filter(Boolean),
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
              <AreaChartCard
                title="Upload Activity"
                subtitle="Daily resume uploads over the last 7 days"
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
                title="Pipeline Status"
                subtitle="Distribution by hiring stage"
                data={metrics.status_distribution}
              />
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {loading ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <>
              <LineChartCard
                title="Processing Trend"
                subtitle="Upload volume trend line"
                data={metrics.uploads_by_day}
                dataKey="count"
                labelKey="label"
              />
              <BarChartCard
                title="Weekly Comparison"
                subtitle="Bar breakdown by day"
                data={metrics.uploads_by_day}
                dataKey="count"
                labelKey="label"
              />
            </>
          )}
        </div>

        {!loading && <RecentActivity uploads={metrics.recent_uploads} />}
      </div>
    </div>
  );
}
