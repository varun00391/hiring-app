"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  title: string;
  value: number;
  icon: LucideIcon;
  accent?: string;
};

export function AnalyticsCard({ title, value, icon: Icon, accent }: Props) {
  return (
    <Card className={cn("group overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all", accent)}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{title}</p>
          <div className="rounded-xl bg-teal-600/10 p-2 text-teal-800 dark:bg-teal-300/15 dark:text-teal-100">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
