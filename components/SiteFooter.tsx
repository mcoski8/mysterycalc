// ============================================================
// SiteFooter — the app-wide footer + legal disclaimer.
//
// Plain English: a small strip at the very bottom of every screen. It
// states what MysteryCalc is (a math/planning tool, not a game-runner or
// payment processor) and the one legal nod we owe — that we're NOT
// affiliated with Nintendo / The Pokémon Company (Decision 012). Putting
// it in the root layout means the disclaimer shows on every page (the
// calculator, the login screen, the customer odds sheet) without copy-
// pasting it into each one.
//
// It's tagged `.no-print` so it disappears when a vendor prints the
// customer odds sheet — that sheet carries its own footer (see
// OddsSheetView). Pure presentation; no state, no data.
// ============================================================

import { APP_NAME } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="no-print border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <p>
          {APP_NAME} is a planning tool for game economics. It does math and
          disclosure only — it doesn&apos;t run games or process payments. Not
          affiliated with Nintendo, The Pokémon Company, or any rights holder.
        </p>
      </div>
    </footer>
  );
}
