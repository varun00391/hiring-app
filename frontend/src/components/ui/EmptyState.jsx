import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data yet",
  description = "Content will appear here once available.",
  action,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-6 py-12 text-center dark:border-slate-700 dark:from-slate-900/80 dark:to-slate-950"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-cyan-50 text-indigo-500 ring-1 ring-indigo-100 dark:from-indigo-950/60 dark:to-cyan-950/60 dark:text-indigo-400 dark:ring-indigo-900/50">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
