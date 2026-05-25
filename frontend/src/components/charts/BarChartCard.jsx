import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

const BAR_COLORS = ["#6366f1", "#818cf8", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#64748b"];

export default function BarChartCard({
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
        <EmptyState icon={BarChart3} title="No bar data" description="Data will appear here soon." />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <defs>
              {BAR_COLORS.map((color, i) => (
                <linearGradient key={color} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.65} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={surface.grid} vertical={false} />
            <XAxis
              dataKey={labelKey}
              tick={{ fill: surface.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: surface.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: surface.cursor }} />
            <Bar dataKey={dataKey} name="Count" radius={[8, 8, 0, 0]} animationDuration={700}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`url(#barGrad${index % BAR_COLORS.length})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
