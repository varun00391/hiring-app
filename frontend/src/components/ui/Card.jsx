import { motion } from "framer-motion";

export default function Card({
  children,
  className = "",
  hover = true,
  padding = "p-6",
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={hover ? { y: -2 } : undefined}
      className={`group rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-indigo-500/5 ${padding} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
