// ============================================================
// Supabase — the BROWSER client.
//
// Plain English: this is how code running in the user's browser (our
// "Client Components") talks to Supabase — for example the login form
// submitting an email + password, or reading who is currently signed in.
//
// It keeps the logged-in session in the browser's cookies (via the
// @supabase/ssr helper) so that the SERVER can read the same session on
// the next request. That cookie sharing is the whole point of using
// @supabase/ssr instead of the plain client.
//
// Safe to ship to the browser: it uses only the PUBLIC url + anon key
// (the "anon" key is meant to be public — real security comes from
// Row-Level Security in the database, see supabase/migrations).
// ============================================================

import { createBrowserClient } from "@supabase/ssr";

/**
 * Make a Supabase client for use inside Client Components.
 * Takes nothing; returns a ready-to-use client bound to our project.
 * Call it inside the component (cheap) rather than at module top level.
 */
export function createClient() {
  return createBrowserClient(
    // These are PUBLIC values (the NEXT_PUBLIC_ prefix means Next.js is
    // allowed to bundle them into the browser). They identify the project;
    // they do not grant privileged access.
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
