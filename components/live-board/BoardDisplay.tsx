// ============================================================
// BoardDisplay — the customer-facing iPad scoreboard (read-only).
//
// Plain English: this is the screen you prop up facing customers. It shows
// the running game in big, bold type — how many chances are left, which
// chase prizes are still up for grabs, the live odds, and a ticker of
// recent wins. It only WATCHES: there are no controls here, so a passer-by
// who scans the public QR can look but can't touch.
//
// How it stays live: it first reads the board once, then subscribes to
// Supabase Realtime for any change to this one row. Each phone tap on the
// controller writes the new state to the database, which pushes here within
// a moment. If the connection drops and comes back (convention WiFi…), we
// RE-READ the row on reconnect so we never miss a change while away. The
// odds are always recomputed here from the starting pool + current state
// (lib/live-board/odds) — we never trust any odds stored in the row.
// ============================================================

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchLiveBoard } from "@/lib/live-board/client";
import type { LiveGameRow } from "@/lib/live-board/types";
import {
  chasePrizesLeft,
  countLeft,
  liveOdds,
  prizesRemaining,
} from "@/lib/live-board/odds";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";
import { WatchQR } from "./WatchQR";

type Props = { code: string };
type Phase = "loading" | "not-found" | "ready" | "ended";

export function BoardDisplay({ code }: Props) {
  const [row, setRow] = useState<LiveGameRow | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [connected, setConnected] = useState(false);
  const [origin, setOrigin] = useState("");
  // True once we've seen a disconnect, so the next SUBSCRIBE triggers a catch-up read.
  const reconnectingRef = useRef(false);

  useEffect(() => {
    // window.origin is only available on the client; setting it here is a
    // one-time init, not a synchronization loop (codebase-standard suppress).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const board = await fetchLiveBoard(code).catch(() => null);
      if (cancelled) return;
      if (!board) {
        setPhase("not-found");
        return;
      }
      setRow(board);
      setPhase("ready");

      // Subscribe to changes on just this board's row.
      channel = supabase
        .channel(`lgb-${board.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "live_games", filter: `id=eq.${board.id}` },
          (payload) => {
            const next = payload.new as Partial<LiveGameRow>;
            setRow((prev) =>
              prev
                ? {
                    ...prev,
                    current_state: next.current_state ?? prev.current_state,
                    display_config: next.display_config ?? prev.display_config,
                    updated_at: next.updated_at ?? prev.updated_at,
                  }
                : prev,
            );
          },
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "live_games", filter: `id=eq.${board.id}` },
          () => setPhase("ended"),
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnected(true);
            // Just (re)connected — if we'd dropped, re-read to catch anything
            // we missed while away. (The DB row is the source of truth.)
            if (reconnectingRef.current) {
              reconnectingRef.current = false;
              fetchLiveBoard(code)
                .then((b) => {
                  if (cancelled) return;
                  if (b) setRow(b);
                  else setPhase("ended");
                })
                .catch(() => {});
            }
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            setConnected(false);
            reconnectingRef.current = true;
          }
        });
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [code]);

  // Recompute everything the panels need from the (frozen) pool + live state.
  // Recomputed here on every change — the row's own numbers are never trusted.
  const derived = useMemo(() => {
    if (!row) return null;
    return {
      count: countLeft(row),
      chases: chasePrizesLeft(row),
      odds: liveOdds(row),
      prizesLeft: prizesRemaining(row.current_state),
      wins: row.current_state.recentWins,
      panels: row.display_config.panels,
      title: row.display_config.title,
    };
  }, [row]);

  if (phase === "loading") {
    return <FullScreen>
      <p className="text-2xl font-medium text-white/70">Connecting to board {code}…</p>
    </FullScreen>;
  }

  if (phase === "not-found") {
    return (
      <FullScreen>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">Board {code} isn&apos;t live</p>
          <p className="mt-3 text-lg text-white/60">
            Double-check the code, or ask the vendor to start the board.
          </p>
          <Link href="/board" className="mt-6 inline-block text-lg font-medium text-gold hover:underline">
            ← Enter a different code
          </Link>
        </div>
      </FullScreen>
    );
  }

  if (phase === "ended" || !row || !derived) {
    return (
      <FullScreen>
        <div className="text-center">
          <p className="text-5xl font-bold text-white">🎉 That&apos;s a wrap!</p>
          <p className="mt-4 text-xl text-white/60">This game has ended. Thanks for playing.</p>
        </div>
      </FullScreen>
    );
  }

  const { count, chases, odds, prizesLeft, wins, panels, title } = derived;
  const pctLeft = count.total > 0 ? (count.remaining / count.total) * 100 : 0;
  const displayUrl = origin ? `${origin}/board/${code}` : `/board/${code}`;
  // Which big panels are on — controls the layout below.
  const showMiddle = panels.chaseLeft || panels.liveOdds;

  return (
    <FullScreen>
      <div className="flex h-full w-full flex-col gap-5 p-6 lg:p-8">
        {/* Top bar: title + connection dot. */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="truncate text-3xl font-bold text-white lg:text-4xl">
            {title || "Mystery Game — Live"}
          </h1>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
              connected ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300",
            )}
          >
            <span
              className={cn(
                "size-2.5 rounded-full",
                connected ? "bg-emerald-400" : "animate-pulse bg-amber-400",
              )}
            />
            {connected ? "Live" : "Reconnecting…"}
          </span>
        </div>

        {/* HERO: X of N left. */}
        {panels.countLeft && (
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 lg:p-8">
            <div className="flex items-end justify-between gap-6">
              <div>
                <div className="text-lg font-medium uppercase tracking-wide text-white/50">
                  Chances left
                </div>
                <div className="bg-gradient-brand bg-clip-text text-7xl font-black tabular-nums text-transparent lg:text-8xl">
                  <AnimatedNumber value={count.remaining} />
                </div>
                <div className="mt-1 text-2xl font-semibold text-white/70">
                  of {count.total.toLocaleString()}
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-5xl font-bold tabular-nums text-gold">
                  <AnimatedNumber value={prizesLeft} />
                </div>
                <div className="text-lg text-white/50">prizes still in</div>
              </div>
            </div>
            {/* How much of the run is left, as a bar. */}
            <div className="mt-5 h-4 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="bg-gradient-brand h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, pctLeft))}%` }}
              />
            </div>
          </div>
        )}

        {/* MIDDLE: chase prizes + live odds, side by side. */}
        {showMiddle && (
          <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-2">
            {panels.chaseLeft && (
              <Panel title="🏆 Chase prizes left">
                {chases.length === 0 ? (
                  <p className="text-xl text-white/40">No chase-tier prizes in this game.</p>
                ) : (
                  <ul className="space-y-3">
                    {chases.map((c) => {
                      const gone = c.remaining <= 0;
                      return (
                        <li
                          key={c.id}
                          className={cn(
                            "flex items-center justify-between gap-4 rounded-2xl px-4 py-3 ring-1 transition-colors",
                            gone
                              ? "bg-white/5 text-white/30 ring-white/5"
                              : "bg-gold/10 text-white ring-gold/30",
                          )}
                        >
                          <span className={cn("truncate text-2xl font-semibold", gone && "line-through")}>
                            {c.name || "Chase prize"}
                          </span>
                          <span className="shrink-0 text-right">
                            {gone ? (
                              <span className="text-xl font-bold text-rose-300">CLAIMED</span>
                            ) : (
                              <span className="text-2xl font-bold tabular-nums text-gold">
                                {c.remaining}
                                <span className="text-base font-normal text-white/40"> / {c.total} left</span>
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
            )}

            {panels.liveOdds && (
              <Panel title="📊 Live odds">
                {odds.length === 0 ? (
                  <p className="text-xl text-white/40">All prizes have been claimed.</p>
                ) : (
                  <ul className="space-y-2 overflow-hidden">
                    {odds.slice(0, 8).map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between gap-4 border-b border-white/5 pb-2 text-white/90 last:border-0"
                      >
                        <span className="truncate text-xl font-medium">{o.name || "Prize"}</span>
                        <span className="shrink-0 text-xl font-bold tabular-nums text-white">
                          {o.probability > 0 ? (
                            <>
                              1 in{" "}
                              <AnimatedNumber
                                value={Math.round(1 / o.probability)}
                                format={(n) => Math.round(n).toLocaleString()}
                              />
                            </>
                          ) : (
                            "—"
                          )}
                          <span className="ml-2 text-base font-normal text-white/40">
                            ({o.remaining} left)
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}
          </div>
        )}

        {/* RECENT WINS ticker. */}
        {panels.recentWins && (
          <Panel title="🎉 Recent wins">
            {wins.length === 0 ? (
              <p className="text-xl text-white/40">No wins yet — be the first!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {wins.slice(0, 10).map((w, i) => (
                  <span
                    key={`${w.ts}-${i}`}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-lg font-medium ring-1",
                      i === 0
                        ? "animate-in fade-in slide-in-from-top-2 bg-gold/20 text-gold ring-gold/40"
                        : "bg-white/5 text-white/70 ring-white/10",
                    )}
                  >
                    {w.name}
                  </span>
                ))}
              </div>
            )}
          </Panel>
        )}

        {/* Footer: scan-to-watch QR + the pairing code, low-key in the corner. */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-white/40">
            Code <span className="font-mono text-base font-bold tracking-widest text-white/70">{code}</span>
          </div>
          <WatchQR url={displayUrl} size={92} />
        </div>
      </div>
    </FullScreen>
  );
}

/** The dark, full-bleed stage the board lives on. */
function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[radial-gradient(ellipse_at_top,oklch(0.28_0.09_285),oklch(0.16_0.03_280))]">
      {children}
    </div>
  );
}

/** A titled glassy card used by the chase / odds / wins panels. */
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex min-h-0 flex-col rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
      <h2 className="mb-4 text-xl font-bold uppercase tracking-wide text-white/50">{title}</h2>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}
