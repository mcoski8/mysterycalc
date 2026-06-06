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
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="mt-1 text-muted-foreground">{APP_TAGLINE}</p>
      </header>

      <Calculator />

      <footer className="mt-16 border-t pt-6 text-xs text-muted-foreground">
        <p>
          {APP_NAME} is a planning tool for game economics. It does math and
          disclosure only — it doesn&apos;t run games or process payments. Not
          affiliated with Nintendo, The Pokémon Company, or any rights holder.
        </p>
      </footer>
    </div>
  );
}
