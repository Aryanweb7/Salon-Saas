"use client";

import { Moon, SunMedium } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, mounted, toggleTheme } = useTheme();

  if (!mounted) {
    return (
      <Button variant="outline" disabled>
        Theme
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={toggleTheme}>
      {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <SunMedium className="mr-2 h-4 w-4" />}
      {theme === "light" ? "Dark" : "Light"}
    </Button>
  );
}
