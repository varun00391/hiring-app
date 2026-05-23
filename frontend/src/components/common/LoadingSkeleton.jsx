export function TableSkeleton({ rows = 5, cols = 8 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((__, col) => (
            <div key={col} className="skeleton-shimmer h-4 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm">
      <div className="skeleton-shimmer h-4 w-28 rounded-md" />
      <div className="skeleton-shimmer mt-4 h-9 w-20 rounded-md" />
      <div className="skeleton-shimmer mt-4 h-10 w-full rounded-md" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm">
      <div className="skeleton-shimmer mb-2 h-5 w-40 rounded-md" />
      <div className="skeleton-shimmer mb-6 h-3 w-56 rounded-md" />
      <div className="skeleton-shimmer h-64 rounded-xl" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <div className="skeleton-shimmer h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-4 w-40 rounded-md" />
            <div className="skeleton-shimmer h-3 w-56 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
