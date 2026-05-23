import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#6366f1", "#10b981", "#ef4444", "#8b5cf6", "#f59e0b", "#64748b"];

export default function PieChartCard({ title, data = [] }) {
  const chartData = data.map((item) => ({
    name: item.status.replace(/_/g, " "),
    value: item.count,
  }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-sm font-semibold text-slate-900">{title}</h3>
        <p className="flex h-64 items-center justify-center text-sm text-slate-500">
          No status data yet
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 text-xs text-slate-600">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="capitalize">{item.name}</span>
            <span className="ml-auto font-medium text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
