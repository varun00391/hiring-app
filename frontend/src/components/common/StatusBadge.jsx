import { getStatusLabel } from "../../utils/constants.js";
import { STATUS_STYLES } from "../../utils/constants.js";

export default function StatusBadge({ status, type = "interview" }) {
  const styles =
    type === "parsing"
      ? {
          pending: "bg-slate-100 text-slate-600",
          processing: "bg-blue-50 text-blue-600",
          completed: "bg-emerald-50 text-emerald-600",
          failed: "bg-red-50 text-red-600",
        }
      : STATUS_STYLES;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] || STATUS_STYLES.new
      }`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
