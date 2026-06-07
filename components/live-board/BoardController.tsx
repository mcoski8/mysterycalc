// ============================================================
// BoardController — the vendor's phone screen for a live board.
//
// Plain English: this is the remote control. It shows every prize with a
// big "Mark won" button (and an Undo for mis-taps), a quick "common pulled"
// tap for filler, switches to choose which panels the iPad shows, the
// pairing code + QR to point customers at, and an "End board" button.
//
// How it stays in sync: every tap updates the screen INSTANTLY (optimistic)
// and then ships the WHOLE new state to the database. Because we always
// send the complete state — not a stream of events — a dropped connection
// is harmless: when the phone comes back online we just re-send the latest
// state, which overwrites whatever was there. A "🔴 offline" banner tells
// the vendor we're tracking locally and will catch up.
//
// Security: the control token lives only in this phone's localStorage and
// is never rendered. If this phone doesn't hold the token, the screen says
// so and offers the watch-only view instead.
//
// Pure logic (decrement / undo / toggle) lives in lib/live-board/state so
// it's unit-tested; this component is the wiring around it.
// ============================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Undo2, Wifi, WifiOff, Power, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUSD } from "@/lib/format";
import type { DisplayConfig, LiveCurrentState, LiveGameRow, LivePanelKey } from "@/lib/live-board/types";
import {
  clearControlToken,
  endLiveBoard,
  fetchLiveBoard,
  getControlToken,
  pushLiveState,
} from "@/lib/live-board/client";
import { markWon, togglePanel, undoWon } from "@/lib/live-board/state";
import { WatchQR } from "./WatchQR";

type Props = { code: string };

type Phase = "loading" | "no-token" | "not-found" | "ready";

// Human labels for the four display panels (matches the iPad panels).
const PANEL_LABELS: { key: LivePanelKey; label: string; hint: string }[] = [
  { key: "countLeft", label: "🔢 Count left", hint: "Big “X of N left”" },
  { key: "chaseLeft", label: "🏆 Chase prizes", hint: "Top prizes still up" },
  { key: "liveOdds", label: "📊 Live odds", hint: "Odds per prize now" },
  { key: "recentWins", label: "🎉 Recent wins", hint: "Scrolling ticker" },
];

export function BoardController({ code }: Props) {
  const router = useRouter();

  // The frozen part of the board (pool, chance count, buy-in). Loaded once.
  const [row, setRow] = useState<LiveGameRow | null>(null);
  // The live, changing part — managed optimistically on this device.
  const [state, setState] = useState<LiveCurrentState | null>(null);
  const [config, setConfig] = useState<DisplayConfig | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");

  // Connection bookkeeping. `online` drives the banner; the refs let the
  // re-sync flush the very latest values without stale closures.
  const [online, setOnline] = useState(true);
  const [dirty, setDirty] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const latestRef = useRef<{ state: LiveCurrentState; config: DisplayConfig } | null>(null);

  const [ending, setEnding] = useState(false);
  const [origin, setOrigin] = useState("");

  // ---- Initial load: do we hold the token, and does the board exist? ----
  useEffect(() => {
    // Client-only init (window origin); one-time, not a sync loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    const token = getControlToken(code);
    tokenRef.current = token;
    if (!token) {
      setPhase("no-token");
      return;
    }
    let cancelled = false;
    fetchLiveBoard(code)
      .then((board) => {
        if (cancelled) return;
        if (!board) {
          setPhase("not-found");
          return;
        }
        setRow(board);
        setState(board.current_state);
        setConfig(board.display_config);
        latestRef.current = { state: board.current_state, config: board.display_config };
        setPhase("ready");
      })
      .catch(() => {
        if (!cancelled) setPhase("not-found");
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  // ---- Push the latest state to the server, with offline handling. ----
  const sync = useCallback(async () => {
    const token = tokenRef.current;
    const latest = latestRef.current;
    if (!token || !latest) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOnline(false);
      setDirty(true);
      return;
    }
    try {
      await pushLiveState(code, token, latest.state, latest.config);
      setOnline(true);
      setDirty(false);
    } catch {
      // Network hiccup or rejected write — keep what we have and try again
      // on reconnect. (A genuinely bad token would also land here, but the
      // token came from a successful create, so a blip is the likely cause.)
      setOnline(false);
      setDirty(true);
    }
  }, [code]);

  // Watch the browser's online/offline signal; flush pending work on return.
  useEffect(() => {
    // Reading the live online status is a client-only init; the cascading-
    // render this rule warns about is harmless here (same pattern as the
    // theme `mounted` flag elsewhere in the app).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof navigator !== "undefined") setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      if (latestRef.current) void sync();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [sync]);

  // Apply a pure state change locally (instant), remember it, then sync.
  function applyState(next: LiveCurrentState) {
    setState(next);
    latestRef.current = { state: next, config: latestRef.current!.config };
    void sync();
  }
  function applyConfig(next: DisplayConfig) {
    setConfig(next);
    latestRef.current = { state: latestRef.current!.state, config: next };
    void sync();
  }

  if (phase === "loading") {
    return <CenterNote>Loading board…</CenterNote>;
  }
  if (phase === "no-token") {
    return (
      <CenterNote>
        <p className="font-medium">This phone doesn&apos;t control board {code}.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Only the phone that started the board can run it (the control key is
          stored on that device and never shared).
        </p>
        <Link
          href={`/board/${code}`}
          className="text-primary mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <Eye className="size-4" /> Watch this board instead
        </Link>
      </CenterNote>
    );
  }
  if (phase === "not-found" || !row || !state || !config) {
    return (
      <CenterNote>
        <p className="font-medium">Board {code} wasn&apos;t found.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have already ended. You can start a fresh one from the calculator.
        </p>
        <Link href="/" className="text-primary mt-4 inline-block text-sm font-medium hover:underline">
          ← Back to the calculator
        </Link>
      </CenterNote>
    );
  }

  // Split the pool into the real prizes (stepper rows) and filler (quick tap).
  const realPrizes = row.initial_pool.filter((i) => !i.isFiller);
  const fillerPrizes = row.initial_pool.filter((i) => i.isFiller);
  const displayUrl = origin ? `${origin}/board/${code}` : `/board/${code}`;

  async function handleEnd() {
    if (!window.confirm("End this board for good? The display will go dark and it can't be reopened.")) {
      return;
    }
    setEnding(true);
    try {
      if (tokenRef.current) await endLiveBoard(code, tokenRef.current);
      clearControlToken(code);
      router.push("/");
    } catch {
      setEnding(false);
      window.alert("Couldn't end the board — check your connection and try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      {/* Offline banner — we keep tracking locally and re-sync on reconnect. */}
      {!online && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          <WifiOff className="size-4 shrink-0" />
          <span>🔴 Offline — taps are saved here and will sync when you reconnect.</span>
        </div>
      )}

      {/* Header: title, the headline count, the pairing code + QR. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="truncate">{config.title || "Live board"}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-normal",
                online ? "text-emerald-600" : "text-amber-600",
              )}
            >
              {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
              {online && !dirty ? "Synced" : online ? "Syncing…" : "Offline"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-4xl font-bold tabular-nums">
                {state.chancesRemaining.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                of {row.initial_chances.toLocaleString()} left
              </div>
            </div>
            <Link
              href={`/board/${code}`}
              target="_blank"
              className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              <Eye className="size-4" /> Open display
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-muted/30 p-3">
            <WatchQR url={displayUrl} size={104} />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Pairing code</div>
              <div className="font-mono text-2xl font-bold tracking-widest">{code}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                On the iPad, open{" "}
                <span className="font-medium text-foreground">{origin ? `${origin}/board` : "/board"}</span>{" "}
                and enter this code — or scan the QR.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark a win — the steppers. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mark a win</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {realPrizes.length === 0 && (
            <p className="text-sm text-muted-foreground">No named prizes in this pool.</p>
          )}
          {realPrizes.map((item) => {
            const remaining = state.remaining[item.id] ?? 0;
            return (
              <div key={item.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{item.name || "Unnamed prize"}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatUSD(item.marketValue)} each
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-semibold tabular-nums">{remaining}</div>
                    <div className="text-[11px] text-muted-foreground">of {item.quantity} left</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => applyState(markWon(state, item, Date.now()))}
                    disabled={remaining <= 0}
                    className="h-11 flex-1 bg-emerald-600 text-white hover:bg-emerald-600/90"
                  >
                    Mark won
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => applyState(undoWon(state, item, row.initial_chances))}
                    disabled={remaining >= item.quantity}
                    className="h-11 px-3"
                    aria-label={`Undo a win for ${item.name}`}
                  >
                    <Undo2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Quick filler tap(s): "common pulled". */}
          {fillerPrizes.map((item) => {
            const remaining = state.remaining[item.id] ?? 0;
            return (
              <div key={item.id} className="rounded-xl border border-dashed bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {item.name || "Common / filler"}{" "}
                      <span className="text-xs font-normal text-muted-foreground">(filler)</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{remaining} left</div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      onClick={() => applyState(markWon(state, item, Date.now()))}
                      disabled={remaining <= 0}
                      variant="secondary"
                      className="h-11"
                    >
                      Common pulled
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => applyState(undoWon(state, item, row.initial_chances))}
                      disabled={remaining >= item.quantity}
                      className="h-11 px-3"
                      aria-label="Undo a filler pull"
                    >
                      <Undo2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* What the iPad shows. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What the display shows</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {PANEL_LABELS.map((panel) => {
            const on = config.panels[panel.key];
            return (
              <button
                key={panel.key}
                type="button"
                onClick={() => applyConfig(togglePanel(config, panel.key))}
                aria-pressed={on}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  on
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/20 opacity-60 hover:opacity-100",
                )}
              >
                <div className="text-sm font-medium">{panel.label}</div>
                <div className="text-[11px] text-muted-foreground">{panel.hint}</div>
                <div className={cn("mt-1 text-xs font-semibold", on ? "text-primary" : "text-muted-foreground")}>
                  {on ? "Showing" : "Hidden"}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* End the board. */}
      <Button
        variant="destructive"
        onClick={handleEnd}
        disabled={ending}
        className="h-11 w-full"
      >
        <Power className="size-4" />
        {ending ? "Ending…" : "End board"}
      </Button>
    </div>
  );
}

/** A centered message card for the loading / error / no-access states. */
function CenterNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border bg-card px-6 py-10 text-center">{children}</div>
    </div>
  );
}
