"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("nav");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={t("theme")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-grid size-9 place-items-center rounded-full border border-border bg-card/60 text-foreground/80 transition-colors hover:text-foreground"
    >
      {/* Avoid hydration mismatch: render a stable icon until mounted */}
      {mounted && !isDark ? (
        <Moon className="size-[18px]" />
      ) : (
        <Sun className="size-[18px]" />
      )}
    </button>
  );
}
