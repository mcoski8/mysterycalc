// ============================================================
// Proxy — runs on every (matched) request before the page renders.
//
// Plain English: this is Next.js 16's "do something on every request"
// hook (formerly called Middleware). Ours has exactly one job: keep the
// logged-in session fresh so the rest of the app always sees an accurate
// "who is signed in." The real work is in lib/supabase/proxy.ts.
//
// It does NOT block or redirect anyone — the calculator works without an
// account (Decision 008). Saving is protected inside the server actions
// and by database Row-Level Security, not here.
// ============================================================

import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on all routes EXCEPT static assets and image files — those don't
  // need a session refresh and excluding them keeps things fast.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
