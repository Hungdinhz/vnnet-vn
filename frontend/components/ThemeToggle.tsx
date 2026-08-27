"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground transition-all focus:outline-none border border-transparent dark:border-indigo-500/10 shadow-sm"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 hidden dark:block text-accent-primary" />
      <Moon className="h-5 w-5 block dark:hidden text-indigo-600" />
    </button>
  );
}
