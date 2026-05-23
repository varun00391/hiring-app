import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card, { CardHeader } from "../ui/Card.jsx";
import ChartTooltip from "../ui/ChartTooltip.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { TrendingUp } from "lucide-react";

export default function LineChartCard({
  title,
  subtitle,
  data = [],
  dataKey = "count",
  labelKey = "label",
}) {
  if (!data.length) {
    return (
      <Card hover={false}>
        <CardHeader title={title} subtitle={subtitle} />
        <EmptyState
          icon={TrendingUp}
          title="No trend data"
          description="Analytics will populate as resumes are processed."
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey={labelKey}
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              name="Volume"
              stroke="url(#lineStroke)"
              strokeWidth={3}
              dot={{ fill: "#6366f1", strokeWidth: 2, r: 4, stroke: "#fff" }}
              activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
