import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  variant?: "icon" | "pill" | "menu-item";
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "icon",
  className = "",
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (variant === "menu-item") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
          isDark
            ? "text-amber-300 hover:bg-slate-800"
            : "text-slate-200 hover:bg-slate-800 hover:text-white"
        } ${className}`}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        <div className="flex items-center gap-2">
          {isDark ? (
            <Sun size={15} className="text-amber-400 shrink-0" />
          ) : (
            <Moon size={15} className="text-slate-300 shrink-0" />
          )}
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">
          {isDark ? "Dark ON" : "Light ON"}
        </span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-all duration-200 shadow-2xs btn-press ${
          isDark
            ? "bg-slate-800/90 hover:bg-slate-700/90 text-amber-300 border-slate-700"
            : "bg-white/10 hover:bg-white/20 text-slate-100 border-white/20"
        } ${className}`}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        {isDark ? (
          <Sun size={14} className="text-amber-400 shrink-0" />
        ) : (
          <Moon size={14} className="text-amber-200 shrink-0" />
        )}
        <span className="font-mono text-[11px] hidden sm:inline">
          {isDark ? "Dark" : "Light"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 border shadow-2xs btn-press group ${
        isDark
          ? "bg-slate-800 text-amber-300 hover:bg-slate-700 border-slate-700 hover:border-slate-600"
          : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border-slate-700"
      } ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="sr-only">Toggle theme</span>
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          size={16}
          className={`absolute transition-all duration-300 transform ${
            isDark
              ? "rotate-0 scale-100 opacity-100 text-amber-400"
              : "-rotate-90 scale-0 opacity-0 text-amber-300"
          }`}
        />
        <Moon
          size={16}
          className={`absolute transition-all duration-300 transform ${
            isDark
              ? "rotate-90 scale-0 opacity-0 text-slate-400"
              : "rotate-0 scale-100 opacity-100 text-slate-200 group-hover:text-white"
          }`}
        />
      </div>
    </button>
  );
};
