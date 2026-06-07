// ============================================================
// CardSearch — type a card name, click a result, add it as a prize.
//
// Plain English: this is the Phase 4 convenience. Instead of typing a card's
// market value by hand, the vendor types its name, sees matching cards (with
// set, number, and TCGPlayer market price), and clicks one. That adds a new
// prize row to the pool pre-filled with the name and market value — the
// vendor then just sets their cost and quantity. Manual entry is untouched:
// this only ADDS rows; the table's own fields stay fully editable.
//
// How it works: it debounces what you type (waits for a pause), asks our own
// /api/prices/search endpoint, and shows the results. If lookup fails or a
// card has no price, it says so and the vendor falls back to typing — the
// feature degrades gracefully, never blocks.
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUSD } from "@/lib/format";
import type { PriceCandidate } from "@/lib/prices/types";

const DEBOUNCE_MS = 400; // wait for a typing pause before searching.
const MIN_LEN = 2;

type Props = {
  /** Called when the vendor picks a card — the parent adds the prize row. */
  onPick: (candidate: PriceCandidate) => void;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "results"; candidates: PriceCandidate[] };

export function CardSearch({ onPick }: Props) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  // Tracks the latest request so a slow earlier search can't overwrite a
  // newer one's results (a classic search-box race).
  const latest = useRef(0);

  useEffect(() => {
    const q = query.trim();
    // Too short to search: do nothing here. The render guard below treats a
    // short query as idle, so we never setState synchronously in the effect.
    if (q.length < MIN_LEN) return;

    const id = ++latest.current;
    const timer = setTimeout(async () => {
      setState({ kind: "loading" });
      try {
        const res = await fetch(`/api/prices/search?q=${encodeURIComponent(q)}`);
        const body = (await res.json()) as {
          candidates?: PriceCandidate[];
          error?: string;
        };
        if (id !== latest.current) return; // a newer search superseded this one.
        if (!res.ok || body.error) {
          setState({
            kind: "error",
            message: body.error ?? "Couldn't search right now — you can enter values manually.",
          });
          return;
        }
        setState({ kind: "results", candidates: body.candidates ?? [] });
      } catch {
        if (id !== latest.current) return;
        setState({
          kind: "error",
          message: "Couldn't reach price lookup — you can enter values manually.",
        });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // After picking a card, clear the box so the list collapses and the vendor
  // can search the next prize.
  function handlePick(candidate: PriceCandidate) {
    onPick(candidate);
    setQuery("");
    setState({ kind: "idle" });
  }

  // A too-short query always reads as idle, no matter what the last search
  // left in `state` (which we deliberately don't reset in the effect).
  const view: State = query.trim().length < MIN_LEN ? { kind: "idle" } : state;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search for a card by name"
            placeholder="Find a card or sealed product (e.g. Charizard ex, or Booster Box) to auto-fill its value…"
            className="pl-8 pr-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Clear search"
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
              onClick={() => setQuery("")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional. Prices are TCGPlayer market values for raw singles and sealed product
          (booster boxes, ETBs, packs). Graded (PSA/BGS) prices aren&apos;t available — enter
          those by hand.
        </p>
      </div>

      {view.kind === "loading" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Searching…
        </p>
      )}

      {view.kind === "error" && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          {view.message}
        </p>
      )}

      {view.kind === "results" && view.candidates.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No cards matched “{query.trim()}”. Check the spelling, or add it manually below.
        </p>
      )}

      {view.kind === "results" && view.candidates.length > 0 && (
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {view.candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => handlePick(c)}
                className="flex w-full items-center gap-3 rounded-md border bg-background px-2 py-1.5 text-left transition-colors hover:bg-accent"
              >
                {c.imageSmall ? (
                  // FRAGILE: card thumbnails come from the pricing API's CDN,
                  // whose hostname varies and migrates (images.pokemontcg.io
                  // and images.scrydex.com both seen). A plain <img> avoids
                  // chasing next/image's hostname allow-list for tiny external
                  // thumbnails; the eslint hint is intentionally silenced.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.imageSmall}
                    alt=""
                    width={32}
                    height={45}
                    loading="lazy"
                    className="h-11 w-8 shrink-0 rounded-sm object-contain"
                  />
                ) : (
                  <div className="h-11 w-8 shrink-0 rounded-sm bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{c.name}</span>
                    {c.kind === "sealed" && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        Sealed
                      </Badge>
                    )}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {/* Singles read "Set · #number · rarity"; sealed product has
                        no card number, so it reads "Set · Booster Box" etc. */}
                    {[
                      c.setName,
                      c.kind === "single" && c.number ? `#${c.number}` : null,
                      c.kind === "single" ? c.rarity : c.priceLabel,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {c.marketValue !== null ? (
                    <>
                      <div className="text-sm font-semibold">{formatUSD(c.marketValue)}</div>
                      {c.priceLabel && (
                        <div className="text-[10px] text-muted-foreground">{c.priceLabel}</div>
                      )}
                    </>
                  ) : (
                    <Badge variant="secondary">No price</Badge>
                  )}
                </div>
                <Plus className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
