import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card, { CardHeader } from "../ui/Card.jsx";
import ChartTooltip from "../ui/ChartTooltip.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { BarChart3 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { getChartSurface } from "../../utils/theme.js";

export default function AreaChartCard({
  title,
  subtitle,
  data = [],
  dataKey = "count",
  labelKey = "label",
}) {
  const { isDark } = useTheme();
  const surface = getChartSurface(isDark);

  if (!data.length) {
    return (
      <Card hover={false}>
        <CardHeader title={title} subtitle={subtitle} />
        <EmptyState
          icon={BarChart3}
          title="No activity data"
          description="Upload resumes to see trends over time."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} subtitle={subtitle} />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={surface.grid} vertical={false} />
            <XAxis
              dataKey={labelKey}
              tick={{ fill: surface.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: surface.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              name="Uploads"
              stroke="url(#strokeGradient)"
              strokeWidth={2.5}
              fill="url(#areaGradient)"
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
