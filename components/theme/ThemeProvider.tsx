// ============================================================
// ThemeProvider — wires up light/dark mode for the whole app.
//
// Plain English: this wraps the app in the `next-themes` provider, which is
// what actually flips the page between light and dark. It does three things
// for us, all the fiddly bits we don't want to hand-write:
//   • adds a `class="dark"` to the <html> tag when dark mode is on (our
//     Tailwind v4 dark styles key off that class), and removes it for light;
//   • remembers the visitor's choice in their browser (localStorage); and
//   • defaults to whatever their device/OS prefers, until they pick.
//
// It also injects a tiny script that runs BEFORE the page paints, so the
// correct theme is applied with no white "flash" on load. That's why the
// <html> tag in layout.tsx carries `suppressHydrationWarning` — the server
// can't know the visitor's saved theme, so a one-element mismatch there is
// expected and silenced.
// ============================================================

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
