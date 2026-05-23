export function TableSkeleton({ rows = 5, cols = 8 }) {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((__, col) => (
            <div key={col} className="h-4 rounded bg-slate-200" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="mt-4 h-8 w-16 rounded bg-slate-200" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-6 h-4 w-32 rounded bg-slate-200" />
      <div className="h-56 rounded-lg bg-slate-100" />
    </div>
  );
}
