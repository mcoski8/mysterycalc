// ============================================================
// ThemeToggle — the little sun/moon button that switches light/dark.
//
// Plain English: one button the visitor clicks to flip between the light and
// dark look. It shows a sun in dark mode (click to go light) and a moon in
// light mode (click to go dark).
//
// GOTCHA: the server has no idea which theme the visitor saved, so we must not
// render a theme-specific icon until the component has "mounted" in the
// browser — otherwise React warns about a server/client mismatch. Until then
// we render a neutral, same-sized placeholder so the layout never jumps.
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Canonical next-themes pattern: flip a "mounted" flag after the first client
  // render so we don't render a theme-specific icon during hydration. The
  // set-state-in-effect lint rule fires on this intentional one-shot.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      // Only act once mounted, so a pre-hydration click can't toggle blind.
      onClick={() => mounted && setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {/* Render the icon only after mount to avoid a hydration mismatch; the
          fixed size keeps the button from resizing when it appears. */}
      {mounted ? (
        isDark ? (
          <Sun className="size-[1.15rem]" />
        ) : (
          <Moon className="size-[1.15rem]" />
        )
      ) : (
        <span className="size-[1.15rem]" />
      )}
    </button>
  );
}
