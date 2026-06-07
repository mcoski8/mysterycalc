// ============================================================
// Home page — the calculator screen.
//
// Plain English: this is the one page of the Phase 1 app. It's a thin
// Server Component shell: a header and footer around the interactive
// <Calculator>, which is a Client Component (it manages typing/state).
// Keeping the shell on the server means less JavaScript for the static
// chrome and a faster first paint.
// ============================================================

import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { Calculator } from "@/components/calculator/Calculator";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AccountMenu } from "@/components/account/AccountMenu";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/configured";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export default async function Home() {
  // Read the current session on the server so the header and the saved-games
  // bar know who's logged in (the calculator itself works either way). Before
  // Supabase is configured we simply treat everyone as logged-out.
  let userEmail: string | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Logo mark: a gradient tile with a sparkle — the "mystery" glint. */}
          <span className="bg-gradient-brand flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-primary/25 ring-1 ring-white/20">
            <Sparkles className="size-6 text-white" strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-gradient-brand text-3xl font-bold tracking-tight sm:text-[2rem]">
              {APP_NAME}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{APP_TAGLINE}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Link to the new field guide explaining every mystery-game format. */}
          <Link
            href="/guide"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <BookOpen className="size-4" />
            <span className="hidden sm:inline">Game guide</span>
          </Link>
          <ThemeToggle />
          <AccountMenu userEmail={userEmail} />
        </div>
      </header>

      {/* The calculator is the page's primary content — the skip-to-content
          link (in the layout) jumps here. The disclaimer footer now lives
          app-wide in the layout (SiteFooter), so it's not repeated here. */}
      <main id="main-content">
        <Calculator userEmail={userEmail} />
      </main>
    </div>
  );
}
