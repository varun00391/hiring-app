import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { EMAIL_TEMPLATES } from "../../utils/constants.js";
import { sendCandidateEmail } from "../../services/communicationService.js";

const TEMPLATE_BODIES = {
  initial_screening: {
    subject: "Initial Screening — HireBot",
    body:
      "Hi {name},\n\nThank you for your interest in the {role} position. We would like to schedule an initial screening conversation.\n\nPlease share your availability for a 30-minute call this week.\n\nBest regards,",
  },
  interview_invitation: {
    subject: "Interview Invitation — {role}",
    body:
      "Hi {name},\n\nWe were impressed with your profile and would like to invite you for an interview for the {role} position.\n\nPlease confirm your availability.\n\nBest regards,",
  },
  follow_up: {
    subject: "Follow-up — {role} Application",
    body:
      "Hi {name},\n\nFollowing up on our previous conversation regarding the {role} role. Please let us know if you have any questions.\n\nBest regards,",
  },
  rejection: {
    subject: "Update on Your Application",
    body:
      "Hi {name},\n\nThank you for taking the time to apply for the {role} position. After careful consideration, we will not be moving forward at this time.\n\nWe wish you the best in your job search.\n\nBest regards,",
  },
  offer_discussion: {
    subject: "Offer Discussion — {role}",
    body:
      "Hi {name},\n\nWe are pleased to move forward with an offer discussion for the {role} position. Please let us know a convenient time to connect.\n\nBest regards,",
  },
};

function applyTemplate(template, candidate) {
  const role = candidate?.position_applied || "the open role";
  const name = candidate?.full_name || "Candidate";
  const replace = (text) => text.replaceAll("{name}", name).replaceAll("{role}", role);
  return {
    subject: replace(template.subject),
    body: replace(template.body),
  };
}

export default function EmailComposeModal({ open, candidate, onClose, onSent }) {
  const [templateKey, setTemplateKey] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [includeSignature, setIncludeSignature] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setTemplateKey("");
    setSubject("");
    setBody("");
    setError(null);
  }, [open, candidate?.id]);

  useEffect(() => {
    if (!templateKey) return;
    const template = TEMPLATE_BODIES[templateKey];
    if (template) {
      const filled = applyTemplate(template, candidate);
      setSubject(filled.subject);
      setBody(filled.body);
    }
  }, [templateKey, candidate]);

  if (!open) return null;

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await sendCandidateEmail({
        candidate_id: candidate.id,
        to_email: candidate.email,
        subject,
        body,
        template_key: templateKey || null,
        include_signature: includeSignature,
      });
      onSent?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Compose Email</h3>
            <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
              <input
                value={candidate?.email || ""}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Template</label>
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="">Custom email</option>
                {EMAIL_TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={(e) => setIncludeSignature(e.target.checked)}
              />
              Include recruiter signature
            </label>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

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
              onClick={handleSend}
              disabled={sending || !subject || !body}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Email
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
