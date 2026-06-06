// ============================================================
// Supabase — session refresh for the Proxy.
//
// Plain English: a logged-in session expires after a while and needs to
// be quietly refreshed. The right place to do that is on every request,
// BEFORE the page renders, so Server Components always see an up-to-date
// "who is logged in." In Next.js 16 that "run on every request" hook is
// the Proxy (it used to be called Middleware — same idea, new name).
//
// This file is the reusable helper; the actual hook is `proxy.ts` at the
// project root, which just calls `updateSession` below.
//
// WARNING (ordering): do not insert logic between creating the client and
// calling `getClaims()` — that call is what triggers the cookie refresh,
// and reordering it is a classic source of random logouts.
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/configured";

/**
 * Refresh the Supabase session cookies for the current request and return
 * the response to send back. Takes the incoming request; returns a
 * NextResponse carrying any refreshed session cookies.
 *
 * Note: we intentionally do NOT redirect anyone here — the calculator is
 * usable logged-out (Decision 008). Access control for SAVING lives in the
 * server actions + database Row-Level Security, not in the proxy.
 */
export async function updateSession(request: NextRequest) {
  // Before Supabase is configured, there's no session to refresh — just let
  // the request through so the calculator keeps working.
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  // Start with a pass-through response; we'll attach refreshed cookies to it.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Mirror any refreshed cookies onto BOTH the request (so this same
        // request sees them) and the outgoing response (so the browser
        // stores them for next time).
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // This read is what actually refreshes an expiring session. Keep it here,
  // immediately after creating the client (see WARNING above).
  await supabase.auth.getClaims();

  return response;
}
