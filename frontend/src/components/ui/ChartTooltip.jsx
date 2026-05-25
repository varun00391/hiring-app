export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-xl shadow-slate-200/50 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-slate-950/50">
      {label && <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>}
      {payload.map((entry) => (
        <div key={entry.name || entry.dataKey} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color || entry.payload?.fill }}
          />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {entry.name || entry.dataKey}: {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
