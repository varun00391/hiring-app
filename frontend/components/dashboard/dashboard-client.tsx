"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  HeartHandshake,
  Hourglass,
  LayoutGrid,
  MessageCircle,
  PartyPopper,
  Search,
  XCircle,
} from "lucide-react";
import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { PipelineSnapshot } from "@/components/dashboard/pipeline-snapshot";
import type { DashboardMetric, PipelineStageRow, TagPerformanceRow } from "@/types/hirebot";

const ICONS: Record<string, typeof LayoutGrid> = {
  total: LayoutGrid,
  open_roles: Search,
  in_offer: PartyPopper,
  hired: HeartHandshake,
  pending: Hourglass,
  hirebot: MessageCircle,
  rejected: XCircle,
  interviews: ClipboardList,
};

/** Per-card accents for a more vibrant dashboard */
const CARD_ACCENTS: Record<string, string> = {
  total: "border-teal-200/80 bg-gradient-to-br from-teal-50 to-cyan-50/80 dark:border-teal-800/50 dark:from-teal-950/50 dark:to-cyan-950/30",
  open_roles: "border-violet-200/80 bg-gradient-to-br from-violet-50 to-fuchsia-50/70 dark:border-violet-800/50 dark:from-violet-950/40 dark:to-fuchsia-950/20",
  in_offer: "border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/70 dark:border-amber-800/50 dark:from-amber-950/40 dark:to-orange-950/20",
  hired: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/70 dark:border-emerald-800/50 dark:from-emerald-950/40 dark:to-teal-950/30",
  pending: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-indigo-50/60 dark:border-sky-800/50 dark:from-sky-950/40 dark:to-indigo-950/20",
  hirebot: "border-cyan-200/80 bg-gradient-to-br from-cyan-50 to-blue-50/70 dark:border-cyan-800/50 dark:from-cyan-950/40 dark:to-blue-950/20",
  rejected: "border-rose-200/80 bg-gradient-to-br from-rose-50 to-red-50/60 dark:border-rose-800/50 dark:from-rose-950/40 dark:to-red-950/20",
  interviews: "border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-violet-50/70 dark:border-indigo-800/50 dark:from-indigo-950/40 dark:to-violet-950/25",
};

export type DashboardVariant = "dashboard" | "analytics" | "recruiters";

type Props = {
  variant: DashboardVariant;
  metrics?: DashboardMetric[];
  performanceRows: TagPerformanceRow[];
  pipeline?: { stages: PipelineStageRow[]; total: number } | null;
};

export function DashboardClient({ variant, metrics, performanceRows, pipeline }: Props) {
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    let rows = [...performanceRows];
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.member_name.toLowerCase().includes(q) ||
          (r.specialization ?? "").toLowerCase().includes(q),
      );
    }
    rows.sort((a, b) =>
      sortDesc ? b.success_ratio - a.success_ratio : a.success_ratio - b.success_ratio,
    );
    return rows;
  }, [performanceRows, query, sortDesc]);

  const cards = metrics ?? [];
  const showKpis = variant === "dashboard" && cards.length > 0;
  const showPipeline = (variant === "dashboard" || variant === "analytics") && pipeline;
  const showPerfTable = variant === "analytics" || variant === "recruiters";
  const pipelineVariant = variant === "analytics" ? "analytics" : "dashboard";

  return (
    <div className="space-y-8">
      {showKpis ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {cards.map((m) => {
            const Icon = ICONS[m.key] ?? LayoutGrid;
            const accent = CARD_ACCENTS[m.key] ?? CARD_ACCENTS.total;
            return (
              <AnalyticsCard key={m.key} title={m.title} value={m.value} icon={Icon} accent={accent} />
            );
          })}
        </div>
      ) : null}

      {showPipeline && pipeline ? (
        <div className={variant === "dashboard" ? "max-w-4xl" : ""}>
          <PipelineSnapshot
            stages={pipeline.stages}
            total={pipeline.total}
            variant={pipelineVariant}
          />
        </div>
      ) : null}

      {showPerfTable ? (
        <div className="rounded-2xl border border-violet-200/40 bg-gradient-to-br from-white/90 via-violet-50/30 to-teal-50/20 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:from-neutral-950/80 dark:via-violet-950/20 dark:to-teal-950/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100/80 pb-4 dark:border-neutral-800">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                TAG team performance
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Velocity, allocations, and success ratios (Version 1 aggregates).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search teammate"
                  className="h-10 w-56 rounded-xl border border-slate-200 bg-white/90 pl-10 pr-3 text-sm text-slate-900 outline-none ring-teal-600/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-50 dark:ring-teal-400/30"
                />
              </div>
              <button
                type="button"
                className="h-10 rounded-xl border border-slate-200 bg-white/80 px-3 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:bg-teal-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-200 dark:hover:bg-neutral-800"
                onClick={() => setSortDesc((v) => !v)}
              >
                Ratio {sortDesc ? "high→low" : "low→high"}
              </button>
            </div>
          </div>
          <div className="mt-4 w-full max-w-full min-w-0 overflow-x-auto rounded-xl ring-1 ring-slate-100 dark:ring-neutral-800">
            <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-slate-600 dark:text-slate-300">
                  <th className="sticky top-0 z-[1] w-[18%] border-b border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
                    Member
                  </th>
                  <th className="sticky top-0 z-[1] w-[22%] border-b border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
                    Specialization
                  </th>
                  <th className="sticky top-0 z-[1] w-[12%] border-b border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
                    Assigned
                  </th>
                  <th className="sticky top-0 z-[1] w-[12%] border-b border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
                    Hired
                  </th>
                  <th className="sticky top-0 z-[1] w-[14%] border-b border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
                    Success
                  </th>
                  <th className="sticky top-0 z-[1] w-[22%] border-b border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
                    Active positions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.member_id}
                    className="border-t border-slate-100 transition hover:bg-teal-50/40 dark:border-neutral-900 dark:hover:bg-neutral-900/40"
                  >
                    <td className="border-b border-slate-100 px-3 py-2 font-semibold text-slate-900 dark:border-neutral-900 dark:text-slate-100">
                      <span className="block truncate" title={row.member_name}>
                        {row.member_name}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700 dark:border-neutral-900 dark:text-slate-300">
                      <span className="block truncate" title={row.specialization ?? "—"}>
                        {row.specialization ?? "—"}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 dark:border-neutral-900">{row.assigned_candidates}</td>
                    <td className="border-b border-slate-100 px-3 py-2 dark:border-neutral-900">{row.hired_candidates}</td>
                    <td className="border-b border-slate-100 px-3 py-2 dark:border-neutral-900">
                      {(row.success_ratio * 100).toFixed(1)}%
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 dark:border-neutral-900">{row.active_positions}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nothing matches your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
