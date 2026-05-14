import { cn } from "@/lib/utils";
import type { CandidateStage } from "@/types/hirebot";

const tone: Record<
  CandidateStage,
  string
> = {
  Applied: "bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-200",
  Screening: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100",
  "Interview Scheduled": "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100",
  "Interview Completed": "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100",
  "Technical Round": "bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-100",
  "HR Round": "bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-900/30 dark:text-fuchsia-100",
  "Offer Sent": "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100",
  Hired: "bg-lime-100 text-lime-900 dark:bg-lime-900/30 dark:text-lime-100",
  Rejected: "bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100",
};

export function StageBadge({ stage, className }: { stage: CandidateStage; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone[stage] ?? "bg-neutral-100 text-neutral-800",
        className,
      )}
    >
      {stage}
    </span>
  );
}
