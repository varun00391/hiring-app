import { motion } from "framer-motion";
import MiniSparkline from "../ui/MiniSparkline.jsx";
import { ACCENT_STYLES } from "../../utils/theme.js";

export default function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "indigo",
  sparklineData,
  index = 0,
}) {
  const style = ACCENT_STYLES[accent] || ACCENT_STYLES.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl ${style.glow}`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {trend && (
            <p className="mt-1 text-xs font-medium text-emerald-600">{trend}</p>
          )}
        </div>
        {Icon && (
          <div className={`shrink-0 rounded-xl p-3 ${style.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {sparklineData?.length > 0 && (
        <MiniSparkline data={sparklineData} color={style.spark} />
      )}
    </motion.div>
  );
}
