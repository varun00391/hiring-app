export const COMMUNICATION_STATUSES = [
  { value: "no_communication", label: "No Communication" },
  { value: "email_sent", label: "Email Sent" },
  { value: "awaiting_reply", label: "Awaiting Reply" },
  { value: "candidate_replied", label: "Candidate Replied" },
  { value: "follow_up_sent", label: "Follow-up Sent" },
  { value: "meeting_confirmed", label: "Meeting Confirmed" },
  { value: "closed", label: "Closed" },
];

export const COMMUNICATION_STATUS_STYLES = {
  no_communication: "bg-slate-100 text-slate-600 border-slate-200",
  email_sent: "bg-blue-50 text-blue-700 border-blue-200",
  awaiting_reply: "bg-amber-50 text-amber-700 border-amber-200",
  candidate_replied: "bg-emerald-50 text-emerald-700 border-emerald-200",
  follow_up_sent: "bg-orange-50 text-orange-700 border-orange-200",
  meeting_confirmed: "bg-violet-50 text-violet-700 border-violet-200",
  closed: "bg-slate-200 text-slate-700 border-slate-300",
};

export const EMAIL_TEMPLATES = [
  { key: "initial_screening", label: "Initial Screening" },
  { key: "interview_invitation", label: "Interview Invitation" },
  { key: "follow_up", label: "Follow-up" },
  { key: "rejection", label: "Rejection" },
  { key: "offer_discussion", label: "Offer Discussion" },
];

export const MEETING_MODES = [
  { value: "google_meet", label: "Google Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "microsoft_teams", label: "Microsoft Teams" },
  { value: "offline", label: "Offline" },
];

export function getCommunicationStatusLabel(status) {
  const match = COMMUNICATION_STATUSES.find((item) => item.value === status);
  return match?.label || getStatusLabel(status);
}

export const INTERVIEW_STATUSES = [
  { value: "new", label: "New" },
  { value: "screening", label: "Screening" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "interviewed", label: "Interviewed" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
  { value: "on_hold", label: "On Hold" },
];

export const STATUS_STYLES = {
  new: "bg-slate-100 text-slate-700 border-slate-200",
  screening: "bg-sky-50 text-sky-700 border-sky-200",
  shortlisted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  interview_scheduled: "bg-violet-50 text-violet-700 border-violet-200",
  interviewed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  selected: "bg-teal-50 text-teal-700 border-teal-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  on_hold: "bg-amber-50 text-amber-700 border-amber-200",
  // Legacy values from earlier versions
  parsed: "bg-sky-50 text-sky-700 border-sky-200",
  hired: "bg-teal-50 text-teal-700 border-teal-200",
};

export const PARSING_STATUS_STYLES = {
  pending: "bg-slate-100 text-slate-600",
  processing: "bg-blue-50 text-blue-600",
  completed: "bg-emerald-50 text-emerald-600",
  failed: "bg-red-50 text-red-600",
};

export const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx";
export const MAX_FILE_SIZE_MB = 10;
export const POSITION_FALLBACK = "Not Specified";

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function getStatusLabel(status) {
  const match = INTERVIEW_STATUSES.find((item) => item.value === status);
  if (match) return match.label;
  if (status === "parsed") return "Screening";
  if (status === "hired") return "Selected";
  return status
    ?.split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
