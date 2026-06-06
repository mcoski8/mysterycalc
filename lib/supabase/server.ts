// ============================================================
// Supabase — the SERVER client.
//
// Plain English: this is how code running on the SERVER (Server
// Components, Server Actions, Route Handlers) talks to Supabase on behalf
// of the logged-in user. It reads the user's session from the request's
// cookies, so the database knows *who* is asking and Row-Level Security
// can scope every query to that one user's saved games.
//
// Why a separate file from the browser client: on the server we don't
// have `localStorage`; the session lives in cookies, and reading/writing
// those cookies is different in Next.js (and is async in Next.js 16).
//
// GOTCHA (Next.js): you can only *write* cookies from a Server Action or
// Route Handler — not while a Server Component is rendering. So `setAll`
// below is wrapped in try/catch: when a Server Component calls this just
// to READ the user, the (harmless) write attempt is ignored, and the
// session cookie gets refreshed by our proxy.ts instead.
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Make a Supabase client for server-side code, wired to the current
 * request's cookies. Returns a Promise because reading cookies is async
 * in Next.js 16 — always `await createClient()`.
 */
export async function createClient() {
  // `cookies()` is async in Next.js 16; it gives us read/write access to
  // the cookies on the in-flight request.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Hand Supabase every cookie on the request so it can find the
        // session.
        getAll() {
          return cookieStore.getAll();
        },
        // Let Supabase refresh/replace the session cookies. If we're inside
        // a Server Component render (where writing cookies isn't allowed),
        // this throws and we swallow it — proxy.ts keeps the session fresh.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore (see header).
          }
        },
      },
    },
  );
}
