// ============================================================
// Login page — the sign-in / sign-up screen.
//
// Plain English: a centered card with the login form. If the vendor is
// ALREADY logged in, there's nothing to do here, so we send them straight
// back to the calculator.
// ============================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/configured";
import { LoginForm } from "@/components/account/LoginForm";
import { APP_NAME } from "@/lib/brand";

export default async function LoginPage() {
  // Until Supabase is wired up, login can't work — show a friendly notice
  // instead of a form that would error.
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="mb-3 text-2xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Accounts aren&apos;t connected yet. The calculator still works without
          one —{" "}
          <Link href="/" className="underline underline-offset-4">
            go back to the calculator
          </Link>
          .
        </p>
      </div>
    );
  }

  // If there's already a session, skip the form.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{APP_NAME}</h1>
      <LoginForm />
    </div>
  );
}
