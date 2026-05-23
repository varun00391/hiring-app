import { useEffect, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { fetchCandidateEmails } from "../../services/communicationService.js";
import { formatDateTime } from "../../utils/formatters.js";
import CommunicationStatusBadge from "../common/CommunicationStatusBadge.jsx";

export default function CommunicationPanel({
  candidate,
  onSendEmail,
  onRefresh,
}) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEmails = async () => {
    if (!candidate?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidateEmails(candidate.id);
      setEmails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [candidate?.id, onRefresh]);

  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Communication
          </h4>
          <div className="mt-2">
            <CommunicationStatusBadge
              status={candidate?.communication_status || "no_communication"}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onSendEmail}
          disabled={!candidate?.email}
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          Send Email
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading email history…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && emails.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <Mail className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No communication yet</p>
          <p className="text-xs text-slate-400">Send the first email to start the conversation</p>
        </div>
      )}

      {!loading && emails.length > 0 && (
        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`rounded-lg border p-3 text-sm ${
                email.direction === "sent"
                  ? "border-indigo-100 bg-indigo-50/40"
                  : "border-emerald-100 bg-emerald-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{email.subject}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {email.direction === "sent" ? "Sent" : "Received"} ·{" "}
                    {formatDateTime(email.timestamp)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    email.direction === "sent"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {email.direction}
                </span>
              </div>
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-slate-600">{email.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
