// ============================================================
// Is Supabase wired up yet?
//
// Plain English: the calculator (Phase 1) must work with NO account and
// even BEFORE the Supabase project exists. So before any code tries to talk
// to Supabase, we check that the two public env vars are actually set. If
// they aren't, the app quietly runs in "logged-out, no saving" mode instead
// of crashing. Once the owner pastes the keys into .env.local, saving turns
// on automatically.
// ============================================================

/**
 * True when both public Supabase env vars are present (so auth + saving can
 * work). False before the project is configured — callers should then skip
 * Supabase and behave as logged-out.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
