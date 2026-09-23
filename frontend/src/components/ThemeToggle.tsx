import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      className="relative inline-flex h-8 w-14 items-center rounded-full border border-[var(--border)] bg-[var(--bg-muted)] transition-colors"
    >
      <span
        className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-elevated)] shadow-md transition-transform ${
          theme === "dark" ? "translate-x-7" : "translate-x-1"
        }`}
      >
        {theme === "dark" ? (
          <Moon className="h-3.5 w-3.5 text-monsoon-400" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-risk-moderate" />
        )}
      </span>
    </button>
  );
}
