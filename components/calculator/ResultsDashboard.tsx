// ============================================================
// ResultsDashboard — the answer, read every way a vendor cares about.
//
// Plain English: once the engine has solved the game, this shows what
// it means. The vendor's "cut" appears three ways — percent kept,
// dollars of profit, and pool multiple — with a toggle for which one
// leads (some vendors think in %, some in $). Below that is the game's
// "feel": how often a player wins (hit rate), the chase/win/dud
// breakdown, how swingy it is (volatility), plus revenue, break-even,
// and the per-prize odds table.
//
// Pure presentation: it takes a finished GameResult and formats it.
// All the numbers were computed by the engine (lib/engine).
// ============================================================

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { GameResult, GameTypeMeta, Volatility } from "@/lib/engine";
import { formatUSD, formatPercent, formatNumber, formatMultiple } from "@/lib/format";

type CutLead = "margin" | "profit" | "multiple";

type Props = {
  result: GameResult;
  meta: GameTypeMeta;
};

// Colors for the three game-feel tiers, reused by the bar and legend.
const TIER_STYLE = {
  chase: { label: "Chase", bar: "bg-amber-400", dot: "bg-amber-400" },
  win: { label: "Win", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  dud: { label: "Dud", bar: "bg-zinc-300 dark:bg-zinc-600", dot: "bg-zinc-300 dark:bg-zinc-600" },
} as const;

const VOLATILITY_STYLE: Record<Volatility, string> = {
  low: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
};

export function ResultsDashboard({ result, meta }: Props) {
  // Which reading of the cut is emphasized (Decision 005: all three,
  // user picks the lead). Defaults to margin %.
  const [lead, setLead] = useState<CutLead>("margin");

  const cuts: { key: CutLead; label: string; value: string }[] = [
    { key: "margin", label: "Margin kept", value: formatPercent(result.marginPct) },
    { key: "profit", label: "Profit (after cost)", value: formatUSD(result.profit) },
    { key: "multiple", label: "Pool multiple", value: formatMultiple(result.poolMultiple) },
  ];

  const totalChances = result.tiers.chase + result.tiers.win + result.tiers.dud;
  const pct = (n: number) => (totalChances > 0 ? (n / totalChances) * 100 : 0);

  return (
    <div className="space-y-6">
      {/* Warnings (non-fatal notices from the engine). */}
      {result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.map((w, i) => (
            <p
              key={i}
              className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
            >
              {w}
            </p>
          ))}
        </div>
      )}

      {/* The cut, three ways. Tap one to make it the lead. */}
      <div className="grid gap-3 sm:grid-cols-3">
        {cuts.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setLead(c.key)}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              lead === c.key
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-input hover:bg-accent",
            )}
          >
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div
              className={cn(
                "mt-1 font-semibold tabular-nums",
                lead === c.key ? "text-3xl" : "text-2xl",
              )}
            >
              {c.value}
            </div>
          </button>
        ))}
      </div>

      {/* Secondary money facts. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Revenue (full sellout)" value={formatUSD(result.revenue)} />
        <Stat label="Pool value" value={formatUSD(result.poolValue)} />
        <Stat label="Avg value / chance" value={formatUSD(result.playerAvgValue)} />
        <Stat
          label="Break-even"
          value={`${formatNumber(result.breakEvenChances)} ${meta.chanceWordPlural}`}
          hint="chances that must sell to cover cost"
        />
      </div>

      <Separator />

      {/* Game feel: hit rate, tiers, volatility. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How the game feels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Hit rate</div>
              <div className="text-2xl font-semibold tabular-nums">
                {formatPercent(result.hitRate)}
              </div>
              <div className="text-xs text-muted-foreground">
                win more than the {formatUSD(result.buyIn)} buy-in
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Volatility</div>
              <Badge className={cn("mt-1 text-sm capitalize", VOLATILITY_STYLE[result.volatility])}>
                {result.volatility}
              </Badge>
            </div>
          </div>

          {/* Stacked chase / win / dud bar. */}
          <div>
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              {(["chase", "win", "dud"] as const).map((k) =>
                result.tiers[k] > 0 ? (
                  <div
                    key={k}
                    className={TIER_STYLE[k].bar}
                    style={{ width: `${pct(result.tiers[k])}%` }}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {(["chase", "win", "dud"] as const).map((k) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className={cn("size-2.5 rounded-full", TIER_STYLE[k].dot)} />
                  {TIER_STYLE[k].label}: {formatNumber(result.tiers[k])} ({formatPercent(pct(result.tiers[k]) / 100)})
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-prize odds — the data the customer odds sheet (Phase 3) will use. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-prize odds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prize</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Odds</TableHead>
                  <TableHead className="text-right">1 in…</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.perPrizeOdds.map((o, i) => (
                  <TableRow key={`${o.name}-${i}`}>
                    <TableCell className="font-medium">{o.name || "Unnamed"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(o.quantity)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPercent(o.probability)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {o.probability > 0 ? formatNumber(Math.round(1 / o.probability)) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** A small labeled number tile used in the secondary-facts row. */
function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
