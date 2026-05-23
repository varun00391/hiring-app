import { ChevronDown, ChevronUp, Download, Eye } from "lucide-react";
import { useMemo } from "react";
import { INTERVIEW_STATUSES, POSITION_FALLBACK } from "../../utils/constants.js";
import { formatDate, formatExperience, formatScore } from "../../utils/formatters.js";
import SearchBar from "../common/SearchBar.jsx";
import StatusDropdown from "../common/StatusDropdown.jsx";
import CommunicationStatusBadge from "../common/CommunicationStatusBadge.jsx";
import { TableSkeleton } from "../common/LoadingSkeleton.jsx";

const SORTABLE_COLUMNS = [
  { key: "full_name", label: "Candidate Name" },
  { key: "email", label: "Email" },
  { key: "position_applied", label: "Position Applied" },
  { key: "total_experience_years", label: "Total Experience" },
  { key: "interview_status", label: "Hiring Status" },
  { key: "communication_status", label: "Communication" },
  { key: "recruiter_name", label: "Recruiter" },
  { key: "resume_score", label: "Resume Score" },
  { key: "upload_date", label: "Upload Date" },
];

export default function CandidateTable({
  candidates,
  loading,
  total,
  page,
  totalPages,
  search,
  statusFilter,
  roleFilter,
  sortBy,
  sortOrder,
  updatingStatusId,
  onSearchChange,
  onStatusFilterChange,
  onRoleFilterChange,
  onSortChange,
  onPageChange,
  onViewDetails,
  onDownload,
  onStatusChange,
}) {
  const roles = useMemo(() => {
    const set = new Set(
      candidates
        .map((c) => c.position_applied)
        .filter((role) => role && role !== POSITION_FALLBACK),
    );
    return Array.from(set);
  }, [candidates]);

  const toggleSort = (key) => {
    if (sortBy === key) {
      onSortChange(key, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, "desc");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 p-4 lg:p-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <SearchBar
              value={search}
              onChange={onSearchChange}
              placeholder="Search by name, email, or role…"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
          >
            <option value="">All statuses</option>
            {INTERVIEW_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-indigo-50/30 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {SORTABLE_COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-slate-800"
                  >
                    {col.label}
                    {sortBy === col.key &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ))}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10}>
                  <TableSkeleton rows={6} cols={10} />
                </td>
              </tr>
            )}
            {!loading && candidates.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                  No candidates found
                </td>
              </tr>
            )}
            {!loading &&
              candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="border-b border-slate-100/80 transition-colors hover:bg-indigo-50/30"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {candidate.full_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{candidate.email || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {candidate.position_applied || POSITION_FALLBACK}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatExperience(candidate.total_experience_years)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusDropdown
                      value={candidate.interview_status}
                      onChange={(status) => onStatusChange(candidate.id, status)}
                      disabled={updatingStatusId === candidate.id}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <CommunicationStatusBadge
                      status={candidate.communication_status || "no_communication"}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{candidate.recruiter_name}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-indigo-600">
                      {formatScore(candidate.resume_score)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(candidate.upload_date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetails(candidate.id)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownload(candidate)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                        title="Download Resume"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/40 px-4 py-3.5 text-sm text-slate-600 lg:px-5">
        <span>
          Showing {candidates.length} of {total} candidates
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
