// ============================================================
// /board — the "watch a board" landing (the iPad joins here).
//
// Plain English: a small page where someone types a board's short code to
// open its live display. It's the read-only front door; starting a board
// happens from the calculator, not here.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Tv } from "lucide-react";
import { JoinBoardForm } from "@/components/live-board/JoinBoardForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Watch a live board",
  description: "Enter a board code to watch a live mystery game — what's left, live odds, and recent wins.",
};

export default function BoardLanding() {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className="bg-gradient-brand flex size-11 items-center justify-center rounded-2xl shadow-lg shadow-primary/25 ring-1 ring-white/20">
          <Tv className="size-6 text-white" strokeWidth={2.25} />
        </span>
        <h1 className="text-gradient-brand text-2xl font-bold tracking-tight">Live board</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Watch a game</CardTitle>
        </CardHeader>
        <CardContent>
          <JoinBoardForm />
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Want to run your own?{" "}
        <Link href="/" className="text-primary inline-flex items-center gap-1 font-medium hover:underline">
          <Sparkles className="size-3.5" /> Build a game in {APP_NAME}
        </Link>
      </p>
    </main>
  );
}
