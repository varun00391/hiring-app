/** Shared design tokens for charts and UI accents */

export const CHART_COLORS = {
  primary: "#6366f1",
  primaryLight: "#818cf8",
  secondary: "#8b5cf6",
  cyan: "#06b6d4",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#94a3b8",
};

export const CHART_GRADIENTS = {
  primary: ["#6366f1", "#818cf8"],
  area: ["#6366f1", "#06b6d4"],
  emerald: ["#10b981", "#34d399"],
  purple: ["#8b5cf6", "#a78bfa"],
};

export const DONUT_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#64748b",
];

export const CHART_SURFACE = {
  light: {
    grid: "#e2e8f0",
    tick: "#64748b",
    cursor: "rgb(99 102 241 / 0.06)",
    pieStroke: "#ffffff",
    dotStroke: "#ffffff",
  },
  dark: {
    grid: "#334155",
    tick: "#94a3b8",
    cursor: "rgb(99 102 241 / 0.12)",
    pieStroke: "#0f172a",
    dotStroke: "#1e293b",
  },
};

export function getChartSurface(isDark) {
  return isDark ? CHART_SURFACE.dark : CHART_SURFACE.light;
}

export const ACCENT_STYLES = {
  indigo: {
    icon: "bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25",
    glow: "group-hover:shadow-indigo-500/10",
    spark: CHART_COLORS.primary,
  },
  emerald: {
    icon: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25",
    glow: "group-hover:shadow-emerald-500/10",
    spark: CHART_COLORS.emerald,
  },
  red: {
    icon: "bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25",
    glow: "group-hover:shadow-red-500/10",
    spark: CHART_COLORS.red,
  },
  violet: {
    icon: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25",
    glow: "group-hover:shadow-violet-500/10",
    spark: CHART_COLORS.secondary,
  },
  amber: {
    icon: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25",
    glow: "group-hover:shadow-amber-500/10",
    spark: CHART_COLORS.amber,
  },
  cyan: {
    icon: "bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25",
    glow: "group-hover:shadow-cyan-500/10",
    spark: CHART_COLORS.cyan,
  },
  slate: {
    icon: "bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-500/20",
    glow: "group-hover:shadow-slate-500/10",
    spark: CHART_COLORS.slate,
  },
};
