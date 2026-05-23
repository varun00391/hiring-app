import { ChevronDown } from "lucide-react";
import { INTERVIEW_STATUSES, STATUS_STYLES, getStatusLabel } from "../../utils/constants.js";

export default function StatusDropdown({ value, onChange, disabled = false }) {
  const style = STATUS_STYLES[value] || STATUS_STYLES.new;

  return (
    <div className="relative inline-flex min-w-[9.5rem]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full cursor-pointer appearance-none rounded-full border py-1.5 pl-3 pr-8 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-60 ${style}`}
        aria-label="Interview status"
      >
        {INTERVIEW_STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
      <span className="sr-only">{getStatusLabel(value)}</span>
    </div>
  );
}
