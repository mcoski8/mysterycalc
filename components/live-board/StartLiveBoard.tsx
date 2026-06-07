// ============================================================
// StartLiveBoard — the "go live" entry point from the calculator.
//
// Plain English: once a vendor has a solved game on screen, this card lets
// them turn it into a live, customer-facing scoreboard with one tap. It
// snapshots the current pool + the solved chance count + buy-in, asks the
// database to create a board (which returns a short pairing code and a
// secret control token), stores that token ON THIS PHONE ONLY, and then
// jumps to the controller screen.
//
// The secret token is never shown anywhere — it goes straight into
// localStorage (via lib/live-board/client) and is only ever used as the
// password for writes. The vendor controls the board from here; the iPad
// just watches by the short code.
// ============================================================

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GameResult, GameType, GameTypeMeta, PrizeItem } from "@/lib/engine";
import { createLiveBoard, saveControlToken } from "@/lib/live-board/client";
import { defaultDisplayConfig, initialState } from "@/lib/live-board/state";

type Props = {
  /** The pool exactly as the calculator currently has it. */
  items: PrizeItem[];
  gameType: GameType;
  meta: GameTypeMeta;
  /** The solved game — gives us the final chance count and buy-in. */
  result: GameResult;
};

export function StartLiveBoard({ items, gameType, meta, result }: Props) {
  const router = useRouter();
  // Prefill the board title with the game's name; the vendor can rename it.
  const [title, setTitle] = useState(meta.displayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Snapshot the current game and ask the server to create the board.
  async function handleStart() {
    setBusy(true);
    setError(null);
    try {
      const { shortCode, controlToken } = await createLiveBoard({
        gameType,
        buyIn: result.buyIn,
        initialChances: result.chances,
        initialPool: items,
        currentState: initialState(items, result.chances),
        displayConfig: defaultDisplayConfig(title),
      });
      // Keep the secret token on THIS device only, then go control the board.
      saveControlToken(shortCode, controlToken);
      router.push(`/board/${shortCode}/control`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't start the live board. Check your connection and try again.",
      );
      setBusy(false);
    }
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-gold/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 text-base">
          <span className="bg-gradient-brand flex size-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm shadow-primary/30">
            <Radio className="size-4" strokeWidth={2.5} />
          </span>
          Run this game live
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Turn this into a customer-facing scoreboard. Prop an iPad up showing
          what&apos;s left, the live odds, and recent wins — and mark wins from
          your phone as you go. Your phone stays in control; the iPad only
          watches.
        </p>

        <div className="space-y-2">
          <Label htmlFor="board-title">Board title (shown on the display)</Label>
          <Input
            id="board-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Wall of Sleeves — Saturday"
            maxLength={60}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100">
            {error}
          </p>
        )}

        <Button
          onClick={handleStart}
          disabled={busy}
          size="lg"
          className="bg-gradient-brand h-11 w-full text-white shadow-md shadow-primary/25 hover:opacity-90"
        >
          <Radio className="size-4" strokeWidth={2.5} />
          {busy ? "Starting…" : "Start live board"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {result.chances.toLocaleString()} {meta.chanceWordPlural} ·{" "}
          {result.prizeCount.toLocaleString()} prizes in the pool
        </p>
      </CardContent>
    </Card>
  );
}
