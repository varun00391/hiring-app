import { motion } from "framer-motion";

export default function Navbar({ title, subtitle, actions }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
      <div className="flex min-h-[4.25rem] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </motion.div>
        {actions && (
          <div className="flex items-center gap-3">{actions}</div>
        )}
      </div>
    </header>
  );
}
