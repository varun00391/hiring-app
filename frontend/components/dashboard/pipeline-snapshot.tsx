"use client";

import type { PipelineStageRow } from "@/types/hirebot";

type Props = {
  stages: PipelineStageRow[];
  total: number;
  /** When true, emphasize share of pipeline; when false, keep numeric focus for ops view */
  variant: "dashboard" | "analytics";
};

export function PipelineSnapshot({ stages, total, variant }: Props) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="rounded-2xl border border-teal-200/50 bg-gradient-to-br from-teal-50/90 via-white to-violet-50/50 p-4 shadow-sm backdrop-blur dark:border-teal-900/40 dark:from-teal-950/40 dark:via-neutral-950/80 dark:to-violet-950/30">
      <div className="border-b border-teal-100/80 pb-3 dark:border-teal-900/50">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {variant === "dashboard" ? "Pipeline snapshot" : "Stage distribution"}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {variant === "dashboard"
            ? "Live counts across hiring stages for a quick health check."
            : "Share of candidates by stage — use this with TAG performance for capacity planning."}
        </p>
      </div>
      <div className="mt-4 space-y-3">
        {stages.map((s) => {
          const share = total > 0 ? s.count / total : 0;
          const relative = variant === "analytics" ? share : s.count / maxCount;
          const widthPct = Math.round(relative * 100);
          return (
            <div key={s.stage} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-200">{s.stage}</span>
                <span className="shrink-0 tabular-nums text-slate-600 dark:text-slate-400">
                  {s.count}
                  {total > 0 ? (
                    <span className="text-slate-400 dark:text-slate-500"> · {Math.round(share * 100)}%</span>
                  ) : null}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/80 ring-1 ring-teal-100/80 dark:bg-neutral-900/60 dark:ring-teal-900/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
        {!total && (
          <p className="py-6 text-center text-sm text-slate-500">No candidates recorded yet.</p>
        )}
      </div>
    </div>
  );
}
