// ============================================================
// Login page — the sign-in / sign-up screen.
//
// Plain English: a centered card with the login form. If the vendor is
// ALREADY logged in, there's nothing to do here, so we send them straight
// back to the calculator.
// ============================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/configured";
import { LoginForm } from "@/components/account/LoginForm";
import { APP_NAME } from "@/lib/brand";

/** The brand lockup (logo mark + gradient wordmark), shared by both states
 *  of this page so the sign-in screen matches the calculator's header. */
function BrandLockup() {
  return (
    <Link href="/" className="mb-6 flex items-center gap-3">
      <span className="bg-gradient-brand flex size-10 items-center justify-center rounded-2xl shadow-lg shadow-primary/25 ring-1 ring-white/20">
        <Sparkles className="size-5 text-white" strokeWidth={2.25} />
      </span>
      <span className="text-gradient-brand text-2xl font-bold tracking-tight">
        {APP_NAME}
      </span>
    </Link>
  );
}

export default async function LoginPage() {
  // Until Supabase is wired up, login can't work — show a friendly notice
  // instead of a form that would error.
  if (!isSupabaseConfigured()) {
    return (
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center"
      >
        <BrandLockup />
        <p className="max-w-sm text-sm text-muted-foreground">
          Accounts aren&apos;t connected yet. The calculator still works without
          one —{" "}
          <Link href="/" className="underline underline-offset-4">
            go back to the calculator
          </Link>
          .
        </p>
      </main>
    );
  }

  // If there's already a session, skip the form.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center px-4 py-12"
    >
      <BrandLockup />
      <LoginForm />
    </main>
  );
}
