// ============================================================
// LoginForm — the email + password sign-in / sign-up card.
//
// Plain English: one small form that does double duty. A toggle flips it
// between "Log in" (for returning vendors) and "Create account" (for new
// ones). Submitting runs the matching server action (see
// app/login/actions.ts), which creates the session and sends the vendor
// back to the calculator. Any error from Supabase is shown under the form.
//
// It's a Client Component because it manages the typed values and the
// log-in/sign-up toggle. The actual auth happens on the server.
// ============================================================

"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const EMPTY: AuthState = { error: null, message: null };

export function LoginForm() {
  // Which mode we're in. "signin" = returning user; "signup" = new account.
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // useActionState wires a server action to the form and gives us back its
  // latest result (error/message) plus a "pending" flag while it runs.
  const [state, formAction, pending] = useActionState(
    mode === "signin" ? signIn : signUp,
    EMPTY,
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">
          {mode === "signin" ? "Log in" : "Create your account"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
            />
          </div>

          {/* Red error (something went wrong) */}
          {state.error && (
            <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100">
              {state.error}
            </p>
          )}
          {/* Neutral note (e.g. "check your email") */}
          {state.message && (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
              {state.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Working…"
              : mode === "signin"
                ? "Log in"
                : "Create account"}
          </Button>
        </form>

        {/* Flip between the two modes. */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4"
                onClick={() => setMode("signup")}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4"
                onClick={() => setMode("signin")}
              >
                Log in
              </button>
            </>
          )}
        </p>

        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-muted-foreground underline underline-offset-4">
            ← Back to the calculator
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
