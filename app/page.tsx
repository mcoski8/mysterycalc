// ============================================================
// Home page — the calculator screen.
//
// Plain English: this is the one page of the Phase 1 app. It's a thin
// Server Component shell: a header and footer around the interactive
// <Calculator>, which is a Client Component (it manages typing/state).
// Keeping the shell on the server means less JavaScript for the static
// chrome and a faster first paint.
// ============================================================

import { Calculator } from "@/components/calculator/Calculator";
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
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="mt-1 text-muted-foreground">{APP_TAGLINE}</p>
        </div>
        <AccountMenu userEmail={userEmail} />
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
