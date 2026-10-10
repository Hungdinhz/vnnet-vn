"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={className || "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground transition-all focus:outline-none border border-transparent dark:border-indigo-500/10 shadow-sm flex-shrink-0"}
      aria-label="Toggle theme"
    >
      <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 hidden dark:block text-accent-primary" />
      <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 block dark:hidden text-indigo-600" />
    </button>
  );
}
