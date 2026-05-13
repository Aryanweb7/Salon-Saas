"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext({
  theme: "light" as Theme,
  mounted: false,
  toggleTheme: () => {},
});

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  // Check if theme was already set by inline script
  const saved = window.localStorage.getItem("salonflow-theme") as Theme | null;
  if (saved) return saved;
  // Check system preference
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    // Ensure class matches (in case script didn't run)
    document.documentElement.classList.toggle("dark", initial === "dark");
    setMounted(true);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const saved = window.localStorage.getItem("salonflow-theme");
      // Only auto-switch if user hasn't manually set a preference
      if (!saved) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const nextTheme = current === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      window.localStorage.setItem("salonflow-theme", nextTheme);
      return nextTheme;
    });
  };

  return <ThemeContext.Provider value={{ theme, mounted, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
