import { useEffect, useState } from "react";
import { Save, Download } from "lucide-react";
import CandidateHeader from "./CandidateHeader.jsx";
import CommunicationPanel from "./CommunicationPanel.jsx";
import ActivityTimeline from "./ActivityTimeline.jsx";
import EmailComposeModal from "./EmailComposeModal.jsx";
import InterviewSchedulerModal from "./InterviewSchedulerModal.jsx";
import { POSITION_FALLBACK } from "../../utils/constants.js";
import { formatDate, formatExperience } from "../../utils/formatters.js";
import { downloadCandidateResume, updateCandidateNotes } from "../../services/candidateService.js";

function Section({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      {children}
    </section>
  );
}

export default function CandidateDrawer({ candidate, open, onClose, onUpdated }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setNotes(candidate?.recruiter_notes || "");
  }, [candidate]);

  if (!open || !candidate) return null;

  const parsed = candidate?.parsed_resume;

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    onUpdated?.();
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await updateCandidateNotes(candidate.id, notes);
      handleRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right">
        <CandidateHeader
          candidate={candidate}
          onSendEmail={() => setEmailModalOpen(true)}
          onScheduleInterview={() => setScheduleModalOpen(true)}
          onClose={onClose}
        />

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <CommunicationPanel
            candidate={candidate}
            onSendEmail={() => setEmailModalOpen(true)}
            onRefresh={refreshKey}
          />

          <ActivityTimeline candidateId={candidate.id} refreshKey={refreshKey} />

          <Section title="Profile Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Role</dt>
                <dd className="text-slate-900">{candidate.position_applied || POSITION_FALLBACK}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-slate-900">{candidate?.phone || parsed?.phone || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Experience</dt>
                <dd className="text-slate-900">{formatExperience(candidate?.total_experience_years)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Recruiter</dt>
                <dd className="text-slate-900">{candidate?.recruiter_name}</dd>
              </div>
            </dl>
          </Section>

          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {(parsed?.technical_skills?.length ? parsed.technical_skills : parsed?.skills)?.map(
                (skill) => (
                  <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {skill}
                  </span>
                ),
              ) || <p className="text-sm text-slate-500">—</p>}
            </div>
          </Section>

          <Section title="Resume">
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-800">{candidate?.file_name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Uploaded {formatDate(candidate?.upload_date)} · {candidate?.file_type?.toUpperCase()}
              </p>
              <button
                type="button"
                onClick={() => downloadCandidateResume(candidate.id, candidate.file_name)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <Download className="h-3.5 w-3.5" />
                Download resume
              </button>
            </div>
          </Section>

          <Section title="Recruiter Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add interview notes, feedback, or follow-up actions…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={saving}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              Save notes
            </button>
          </Section>
        </div>
      </aside>

      <EmailComposeModal
        open={emailModalOpen}
        candidate={candidate}
        onClose={() => setEmailModalOpen(false)}
        onSent={handleRefresh}
      />
      <InterviewSchedulerModal
        open={scheduleModalOpen}
        candidate={candidate}
        onClose={() => setScheduleModalOpen(false)}
        onScheduled={handleRefresh}
      />
    </>
  );
}
