import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { MEETING_MODES } from "../../utils/constants.js";
import { scheduleInterview } from "../../services/interviewService.js";

export default function InterviewSchedulerModal({ open, candidate, onClose, onScheduled }) {
  const [form, setForm] = useState({
    interview_type: "Technical Interview",
    scheduled_date: "",
    scheduled_time: "10:00",
    duration_minutes: 60,
    interviewer_name: candidate?.recruiter_name || "",
    meeting_mode: "google_meet",
    notes: "",
    location: "",
    send_email_invite: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      ...prev,
      interviewer_name: candidate?.recruiter_name || prev.interviewer_name,
    }));
    setError(null);
  }, [open, candidate]);

  if (!open) return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await scheduleInterview({
        candidate_id: candidate.id,
        ...form,
        duration_minutes: Number(form.duration_minutes),
        location: form.meeting_mode === "offline" ? form.location : null,
      });
      onScheduled?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Schedule Interview</h3>
            <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Interview Type</label>
              <input
                value={form.interview_type}
                onChange={(e) => update("interview_type", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => update("scheduled_date", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Time (UTC)</label>
              <input
                type="time"
                value={form.scheduled_time}
                onChange={(e) => update("scheduled_time", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Duration (min)</label>
              <input
                type="number"
                min={15}
                step={15}
                value={form.duration_minutes}
                onChange={(e) => update("duration_minutes", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Interviewer</label>
              <input
                value={form.interviewer_name}
                onChange={(e) => update("interviewer_name", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Meeting Mode</label>
              <select
                value={form.meeting_mode}
                onChange={(e) => update("meeting_mode", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                {MEETING_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
            {form.meeting_mode === "offline" && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.send_email_invite}
                onChange={(e) => update("send_email_invite", e.target.checked)}
              />
              Send interview invitation email to candidate
            </label>
          </div>

          {error && (
            <div className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !form.scheduled_date || !form.interviewer_name}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Schedule Interview
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
