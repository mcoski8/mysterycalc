// ============================================================
// Sealed-products Supabase clients — plain, cookie-free connections.
//
// Plain English: the rest of our Supabase code (lib/supabase/server.ts) is
// wired to the logged-in USER via request cookies — perfect for saved games,
// but wrong here. The sealed-products table is public catalog data touched by
// background jobs (the sync, the nightly cron) and read by a server route, none
// of which have a user session. So this file makes simple supabase-js clients
// straight from environment keys, with NO cookies and NO session.
//
//  - adminClient(): uses the SERVICE-ROLE key (bypasses RLS) → the ONLY thing
//    allowed to WRITE the table. Used by the sync + cron. Server-only secret.
//  - readClient(): uses the anon key (RLS lets anyone SELECT) → used by the
//    price search to READ the table. Falls back to the service key if that's
//    all that's available.
//
// WARNING: never import this from client-side code — the service key must
// never reach the browser. It's only used in scripts and server routes.
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function url(): string {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!u) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return u;
}

/** Service-role client — bypasses RLS. The only thing that may WRITE the table. */
export function adminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (needed to write sealed_products)");
  return createClient(url(), key, { auth: { persistSession: false } });
}

/** Read-only client for the search route. Anon key is enough (RLS allows select). */
export function readClient(): SupabaseClient {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("No Supabase key available to read sealed_products");
  return createClient(url(), key, { auth: { persistSession: false } });
}
