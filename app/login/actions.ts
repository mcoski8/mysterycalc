// ============================================================
// Auth actions — the server-side "log in / sign up / log out" logic.
//
// Plain English: these run ON THE SERVER when the login form is submitted
// (or the "Log out" button is clicked). They talk to Supabase to create
// or end a session, and the session is stored in cookies so the rest of
// the app knows who's signed in.
//
// They are imported by the login page (app/login/page.tsx) and the account
// menu in the header (components/account/AccountMenu.tsx).
// ============================================================

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * The result a login/signup form gets back. `error` shows a red message;
 * `message` shows a neutral note (e.g. "check your email"). Both null =
 * success (the action will have redirected before returning in that case).
 */
export type AuthState = { error: string | null; message: string | null };

/**
 * Log an existing user in with email + password. On success, redirects to
 * the calculator; on failure, returns the error to show under the form.
 */
export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message, message: null };

  // Refresh server-rendered chrome (the header) so it shows the new session.
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Create a new account with email + password. If the project has email
 * confirmations turned ON, Supabase returns no session yet — we tell the
 * user to check their inbox. If confirmations are OFF, they're logged in
 * immediately and we send them to the calculator.
 */
export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters.", message: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message, message: null };

  // No session means email confirmation is required before first login.
  if (!data.session) {
    return {
      error: null,
      message: "Account created. Check your email to confirm, then log in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * End the current session and return to the calculator (still usable
 * logged-out). Called from the header's "Log out" button.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
