// ============================================================
// Email confirmation handler.
//
// Plain English: when email confirmations are turned ON, Supabase emails a
// new user a link that points here with a one-time token. This handler
// exchanges that token for a real session, then sends them to the
// calculator. If confirmations are OFF (the recommended dev setting),
// this route simply never gets used.
//
// It's a Route Handler (GET) because the link in the email is a plain URL
// the browser visits.
// ============================================================

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Where to land after confirming (defaults to the calculator).
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Token missing or invalid → send them to the login page to try again.
  return NextResponse.redirect(new URL("/login?error=confirm", request.url));
}
