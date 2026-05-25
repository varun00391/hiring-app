import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import Card, { CardHeader } from "../ui/Card.jsx";
import ChartTooltip from "../ui/ChartTooltip.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { PieChart as PieIcon } from "lucide-react";
import { DONUT_COLORS, getChartSurface } from "../../utils/theme.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function PieChartCard({ title, subtitle, data = [] }) {
  const { isDark } = useTheme();
  const surface = getChartSurface(isDark);
  const chartData = data.map((item) => ({
    name: item.status.replace(/_/g, " "),
    value: item.count,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <Card hover={false}>
        <CardHeader title={title} subtitle={subtitle} />
        <EmptyState
          icon={PieIcon}
          title="No status breakdown"
          description="Candidate statuses will appear once profiles are added."
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={4}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                  stroke={surface.pieStroke}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{total}</span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Total</span>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {chartData.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-2.5 py-2 text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-400"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-900"
              style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
            />
            <span className="truncate capitalize">{item.name}</span>
            <span className="ml-auto font-semibold text-slate-900 dark:text-slate-100">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
