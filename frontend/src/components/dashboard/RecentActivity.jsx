import { motion } from "framer-motion";
import { FileUp } from "lucide-react";
import { formatDate, formatScore, getInitials } from "../../utils/formatters.js";
import StatusBadge from "../common/StatusBadge.jsx";
import Card, { CardHeader } from "../ui/Card.jsx";
import EmptyState from "../ui/EmptyState.jsx";

export default function RecentActivity({ uploads = [] }) {
  return (
    <Card hover={false} padding="p-0" className="overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <CardHeader
          title="Recent Uploads"
          subtitle="Latest candidates added to the pipeline"
        />
      </div>

      {uploads.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={FileUp}
            title="No uploads yet"
            description="Upload resumes from the Candidate Details page to see activity here."
          />
        </div>
      ) : (
        <div className="custom-scrollbar max-h-[420px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
          {uploads.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700 ring-2 ring-white dark:from-indigo-900/60 dark:to-violet-900/60 dark:text-indigo-300 dark:ring-slate-900">
                {getInitials(item.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.full_name || "Unknown Candidate"}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {item.position_applied || "No role specified"} · {formatDate(item.upload_date)}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={item.interview_status} />
                <p className="mt-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatScore(item.resume_score)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}
