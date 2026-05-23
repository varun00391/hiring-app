import { useEffect, useState } from "react";
import {
  Calendar,
  FileText,
  Mail,
  MessageSquare,
  User,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { fetchCandidateTimeline } from "../../services/timelineService.js";
import { formatDateTime } from "../../utils/formatters.js";

const EVENT_ICONS = {
  resume_uploaded: Upload,
  resume_parsed: FileText,
  recruiter_assigned: User,
  email_sent: Mail,
  email_received: MessageSquare,
  interview_scheduled: Calendar,
  interview_confirmed: CheckCircle2,
  feedback_added: MessageSquare,
  status_changed: CheckCircle2,
  notes_updated: MessageSquare,
  communication_status_changed: Mail,
};

export default function ActivityTimeline({ candidateId, refreshKey = 0 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidateId) return;
    let active = true;
    setLoading(true);
    fetchCandidateTimeline(candidateId)
      .then((data) => {
        if (active) setEvents(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [candidateId, refreshKey]);

  if (loading) {
    return (
      <section className="rounded-lg border border-slate-200 p-4">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Activity Timeline
        </h4>
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Activity Timeline
      </h4>

      {events.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No activity recorded yet</p>
      ) : (
        <div className="max-h-80 space-y-0 overflow-y-auto pr-1">
          {events.map((event, index) => {
            const Icon = EVENT_ICONS[event.event_type] || CheckCircle2;
            return (
              <div key={event.id} className="relative flex gap-3 pb-5">
                {index < events.length - 1 && (
                  <span className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-slate-200" />
                )}
                <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-slate-900">{event.description}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {event.actor ? `${event.actor} · ` : ""}
                    {formatDateTime(event.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
