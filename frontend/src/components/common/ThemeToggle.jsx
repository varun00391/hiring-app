import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="relative flex h-10 w-[4.5rem] items-center rounded-full border border-slate-200/80 bg-slate-100/80 p-1 shadow-sm transition-colors hover:bg-slate-200/80 dark:border-slate-700/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80"
    >
      <span
        className={`absolute h-8 w-8 rounded-full bg-white shadow-md transition-transform duration-300 dark:bg-slate-600 ${
          isDark ? "translate-x-[2.125rem]" : "translate-x-0"
        }`}
      />
      <Sun
        className={`relative z-10 ml-1.5 h-4 w-4 transition-colors ${
          isDark ? "text-slate-500" : "text-amber-500"
        }`}
      />
      <Moon
        className={`relative z-10 ml-auto mr-1.5 h-4 w-4 transition-colors ${
          isDark ? "text-indigo-300" : "text-slate-400"
        }`}
      />
    </button>
  );
}
