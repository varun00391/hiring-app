import { formatDate, formatScore, getInitials } from "../../utils/formatters.js";
import StatusBadge from "../common/StatusBadge.jsx";

export default function RecentActivity({ uploads = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-900">Recent Uploads</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {uploads.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-slate-500">No uploads yet</p>
        )}
        {uploads.map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
              {getInitials(item.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {item.full_name || "Unknown Candidate"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {item.position_applied || "No role specified"} · {formatDate(item.upload_date)}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge status={item.interview_status} />
              <p className="mt-1 text-xs text-slate-500">{formatScore(item.resume_score)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
