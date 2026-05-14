"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { StageBadge } from "@/components/ui/stage-badge";
import { Button } from "@/components/ui/button";
import type { CandidateRow, CandidateStage } from "@/types/hirebot";

type PageResp = {
  items: CandidateRow[];
  total: number;
  page: number;
  page_size: number;
};

export function CandidatesBoard() {
  const token = useAuthStore((s) => s.token);
  const admin = useAuthStore((s) => s.user?.role.name === "admin");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<CandidateStage | "">("");
  const [busy, setBusy] = useState(false);

  const queryKey = ["candidates", page, search, stage];

  const { data, refetch, isFetching } = useQuery({
    queryKey,
    enabled: !!token,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: "20" });
      if (search.trim()) params.set("search", search.trim());
      if (stage) params.set("stage", stage);
      const { data: payload } = await api.get<PageResp>(`/candidates?${params.toString()}`);
      return payload;
    },
  });

  const sorted = useMemo(() => data?.items ?? [], [data]);

  async function exportCsv() {
    try {
      setBusy(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (stage) params.set("stage", stage);
      const qs = params.toString();
      const url = `${api.defaults.baseURL}/candidates/export${qs ? `?${qs}` : ""}`;
      const response = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const dl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = dl;
      anchor.download = `candidates-page-${page}.csv`;
      anchor.click();
      URL.revokeObjectURL(dl);
      toast.success("Export ready");
    } catch {
      toast.error("Export failed — try again shortly");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>
          <p className="text-sm text-neutral-500">Search, filter, export, and jump into deep profiles.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv} disabled={busy}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Link href="/candidates/import">
            <Button size="sm" className="gap-2 bg-teal-600 text-white hover:bg-teal-700">
              <Upload className="h-4 w-4" />
              Upload resume
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-teal-200/50 bg-gradient-to-br from-white/95 via-teal-50/20 to-violet-50/30 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:from-neutral-950/85 dark:via-neutral-950/80 dark:to-violet-950/20">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-xs uppercase text-neutral-500">
            Search
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Name, role, ID…"
              className="mt-1 h-10 w-72 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-normal normal-case text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-900/30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50"
            />
          </label>
          <label className="flex flex-col text-xs uppercase text-neutral-500">
            Stage
            <select
              value={stage}
              onChange={(e) => {
                setPage(1);
                setStage((e.target.value || "") as CandidateStage | "");
              }}
              className="mt-1 h-10 min-w-[200px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-normal normal-case dark:border-neutral-800 dark:bg-neutral-900"
            >
              <option value="">All stages</option>
              {([
                "Applied",
                "Screening",
                "Interview Scheduled",
                "Interview Completed",
                "Technical Round",
                "HR Round",
                "Offer Sent",
                "Hired",
                "Rejected",
              ] as CandidateStage[]).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          {admin && (
            <p className="text-xs text-neutral-500">
              Admins inherit global visibility. TAG teammates only review assigned pipelines.
            </p>
          )}
        </div>

        <div className="mt-4 w-full max-w-full min-w-0 overflow-x-auto rounded-xl ring-1 ring-teal-100/60 dark:ring-neutral-800">
          <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <Th className="w-[9%]">ID</Th>
                <Th className="w-[14%]">Name</Th>
                <Th className="w-[14%]">Applied role</Th>
                <Th className="w-[6%]">Years</Th>
                <Th className="w-[11%]">Stage</Th>
                <Th className="w-[7%]">AI match</Th>
                <Th className="w-[12%]">Recruiter</Th>
                <Th className="w-[12%]">TAG</Th>
                <Th className="w-[9%]">Interview</Th>
                <Th className="w-[10%]">Updated</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-slate-100 hover:bg-teal-50/50 dark:border-neutral-900 dark:hover:bg-neutral-900/60"
                >
                  <Td className="font-mono text-xs">
                    <span className="block truncate" title={row.public_id}>
                      {row.public_id}
                    </span>
                  </Td>
                  <Td>
                    <Link href={`/candidates/${row.id}`} className="block truncate font-semibold text-teal-700 hover:underline dark:text-teal-300" title={row.full_name}>
                      {row.full_name}
                    </Link>
                  </Td>
                  <Td>
                    <span className="block truncate" title={row.applied_role ?? undefined}>
                      {row.applied_role}
                    </span>
                  </Td>
                  <Td>{row.experience_years ?? "—"}</Td>
                  <Td>
                    <div className="truncate">
                      <StageBadge stage={row.current_stage} />
                    </div>
                  </Td>
                  <Td>{row.ai_match_score ?? "—"}</Td>
                  <Td>
                    <span className="block truncate" title={row.recruiter_name ?? "—"}>
                      {row.recruiter_name ?? "—"}
                    </span>
                  </Td>
                  <Td>
                    <span className="block truncate" title={row.tag_member_name ?? "—"}>
                      {row.tag_member_name ?? "—"}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-xs">
                    {row.interview_date ? new Date(row.interview_date).toLocaleDateString() : "—"}
                  </Td>
                  <Td className="whitespace-nowrap text-xs">
                    {new Date(row.updated_at).toLocaleString()}
                  </Td>
                </tr>
              ))}
              {!sorted.length && (
                <tr>
                  <td className="px-4 py-8 text-center text-neutral-500" colSpan={10}>
                    No candidates found for those filters yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data ? (
          <div className="mt-4 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
            <p>
              Page {data.page} · {data.total.toLocaleString()} total · {data.page_size} per page
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * data.page_size >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`sticky top-0 z-[1] border-b border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={`max-w-0 border-b border-slate-100 px-3 py-2 dark:border-neutral-900 ${className ?? ""}`}>
      {children}
    </td>
  );
}

