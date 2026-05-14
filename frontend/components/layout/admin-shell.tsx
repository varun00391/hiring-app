"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/recruiters", label: "Recruiters", icon: BriefcaseBusiness },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, clear } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Redirecting…
      </div>
    );
  }

  const headerCopy = (() => {
    if (pathname.startsWith("/dashboard")) {
      return { kicker: "Overview", title: "Command center" };
    }
    if (pathname.startsWith("/analytics")) {
      return { kicker: "Insights", title: "Analytics & TAG performance" };
    }
    if (pathname.startsWith("/candidates")) {
      return { kicker: "Pipeline", title: "Candidates" };
    }
    if (pathname.startsWith("/recruiters")) {
      return { kicker: "Staffing", title: "Recruiters & TAG" };
    }
    if (pathname.startsWith("/settings")) {
      return { kicker: "Workspace", title: "Settings" };
    }
    return { kicker: "Workspace", title: "Operational overview" };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/80 via-white to-violet-100/60 text-slate-900 dark:from-neutral-950 dark:via-slate-950 dark:to-violet-950/40 dark:text-slate-50">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col border-r border-teal-200/40 bg-gradient-to-b from-teal-900/95 via-teal-800/90 to-violet-900/95 px-4 py-6 text-white shadow-lg shadow-teal-900/20 backdrop-blur dark:border-teal-800/50">
          <div className="mb-10 px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/90">HireBot</p>
            <p className="mt-2 text-lg font-semibold tracking-tight">Talent Console</p>
            <div className="mt-4 rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
              <p className="text-[11px] uppercase text-teal-100/80">Signed in</p>
              <p className="truncate text-sm font-medium">{user?.full_name ?? "Team member"}</p>
              <p className="truncate text-[11px] text-teal-200/90">{user?.role.name}</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-white text-teal-900 shadow-md shadow-black/10"
                      : "text-teal-50/90 hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="outline"
            size="sm"
            className="mt-6 gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
            onClick={() => {
              clear();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </aside>
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-teal-100/60 bg-white/75 px-8 py-4 shadow-sm shadow-teal-900/5 backdrop-blur dark:border-neutral-800 dark:bg-slate-950/85">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-teal-700/80 dark:text-teal-300/80">{headerCopy.kicker}</p>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{headerCopy.title}</h1>
            </div>
          </header>
          <main className="min-w-0 flex-1 space-y-6 overflow-x-hidden px-8 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
