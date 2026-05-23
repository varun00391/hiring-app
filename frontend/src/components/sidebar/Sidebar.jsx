import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/candidates", label: "Candidate Details", icon: Users },
];

export default function Sidebar() {
  return (
    <aside className="glass-panel fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200/60 shadow-xl shadow-slate-200/20">
      <div className="flex h-[4.25rem] items-center gap-3 border-b border-slate-200/60 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
          H
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-slate-900">HireBot</p>
          <p className="text-[11px] font-medium text-slate-500">AI Recruiting Platform</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Menu
        </p>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="block">
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                {label}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200/60 p-4">
        <div className="rounded-xl bg-gradient-to-br from-indigo-50/90 via-violet-50/50 to-cyan-50/90 p-4 ring-1 ring-indigo-100/80">
          <div className="mb-2 flex items-center gap-2 text-indigo-600">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-semibold">AI-Powered ATS</p>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            Parse resumes, track candidates, and manage hiring workflows in one place.
          </p>
        </div>
      </div>
    </aside>
  );
}
