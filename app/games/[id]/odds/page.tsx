// ============================================================
// Customer Odds Sheet page — /games/[id]/odds
//
// Plain English: this is the printable, customer-facing sheet for ONE saved
// game. A logged-in vendor reaches it from their "My games" list, prints it
// or saves it as a PDF, and posts/hands it to players so they can see the
// pool and their odds before playing.
//
// It's a thin Server Component: it confirms who's logged in, loads the saved
// game (Row-Level Security guarantees it's theirs), turns it into a
// customer-safe odds sheet with the pure builder, and hands that to the
// interactive <OddsSheetView>. All the cost/profit/margin numbers are
// dropped by the builder and never reach this page.
//
// GOTCHA: in Next.js 16 a dynamic route's `params` is a Promise — it must be
// awaited before reading `id`.
// ============================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { loadGameForSheet } from "@/lib/saved-games/actions";
import { buildOddsSheet, type OddsSheet } from "@/lib/odds-sheet/build";
import { EngineError } from "@/lib/engine";
import { isSupabaseConfigured } from "@/lib/supabase/configured";
import { createClient } from "@/lib/supabase/server";
import { OddsSheetView } from "@/components/odds-sheet/OddsSheetView";

export default async function OddsSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Saved games only exist with Supabase configured and a logged-in vendor.
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load name + snapshot (RLS makes it impossible to read someone else's game).
  const loaded = await loadGameForSheet(id);
  if (!loaded.ok) {
    return <Problem message={loaded.error} />;
  }

  // Build the customer-safe sheet. The engine throws on a genuinely broken
  // pool (empty, impossible margin) — capture that as a friendly note, not a
  // crash. We compute first and render afterwards (constructing JSX inside a
  // try/catch can't catch render-time errors, so we keep them separate).
  let sheet: OddsSheet | null = null;
  let buildError: string | null = null;
  try {
    sheet = buildOddsSheet(loaded.data.snapshot, loaded.data.name);
  } catch (e) {
    buildError =
      e instanceof EngineError
        ? e.message
        : "This game can't be turned into an odds sheet yet.";
  }

  if (sheet === null) {
    return <Problem message={buildError ?? "This game can't be shown yet."} />;
  }
  return <OddsSheetView sheet={sheet} />;
}

/** A simple centered message with a way back to the calculator. */
function Problem({ message }: { message: string }) {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center"
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Back to the calculator
      </Link>
    </main>
  );
}
