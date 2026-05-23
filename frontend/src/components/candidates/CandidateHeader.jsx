import { Calendar, Mail, X } from "lucide-react";
import StatusBadge from "../common/StatusBadge.jsx";
import CommunicationStatusBadge from "../common/CommunicationStatusBadge.jsx";
import { POSITION_FALLBACK } from "../../utils/constants.js";
import { formatScore, getInitials } from "../../utils/formatters.js";

export default function CandidateHeader({
  candidate,
  onSendEmail,
  onScheduleInterview,
  onClose,
}) {
  return (
    <div className="border-b border-slate-200 px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-lg font-semibold text-indigo-700">
            {getInitials(candidate?.full_name)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {candidate?.full_name || "Candidate Details"}
            </h2>
            <p className="text-sm text-slate-500">
              {candidate?.position_applied || POSITION_FALLBACK}
            </p>
            <p className="text-xs text-slate-400">{candidate?.email || "No email on file"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={candidate?.interview_status} />
        <CommunicationStatusBadge status={candidate?.communication_status || "no_communication"} />
        <StatusBadge status={candidate?.parsing_status} type="parsing" />
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          AI Score: {formatScore(candidate?.resume_score)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSendEmail}
          disabled={!candidate?.email}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Mail className="h-4 w-4" />
          Send Email
        </button>
        <button
          type="button"
          onClick={onScheduleInterview}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Calendar className="h-4 w-4" />
          Schedule Interview
        </button>
      </div>
    </div>
  );
}
