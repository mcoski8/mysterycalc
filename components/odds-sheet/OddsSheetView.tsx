// ============================================================
// OddsSheetView — the printable customer odds sheet.
//
// Plain English: this draws the sheet a player sees — the game's name, the
// buy-in, the whole prize pool, and the odds of pulling each prize. The
// vendor can type an optional shop/event name at the top, then hit Print
// (or "Save as PDF" in the print dialog) to post or hand out.
//
// It is a Client Component for two small reasons: the Print button calls the
// browser's print dialog, and the shop-name field is editable on screen.
// Everything it shows comes pre-computed from the pure builder
// (lib/odds-sheet/build.ts) — there is NO cost/profit/margin in its data,
// by design.
//
// The on-screen-only controls (back link, print button, the shop-name input)
// are wrapped in `.no-print` so they vanish on the printed page (see the
// @media print rules in app/globals.css).
// ============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUSD, formatPercent, formatNumber } from "@/lib/format";
import { APP_NAME } from "@/lib/brand";
import type { OddsSheet } from "@/lib/odds-sheet/build";

/**
 * Render odds as a friendly "≈ 1 in N" string. People read raffle-style odds
 * more easily as "1 in 25" than as "4%". Returns null for impossible odds so
 * the caller can fall back to just the percentage.
 */
function oneInText(probability: number): string | null {
  if (!(probability > 0)) return null;
  const denom = Math.round(1 / probability);
  return denom >= 1 ? `1 in ${formatNumber(denom)}` : null;
}

export function OddsSheetView({ sheet }: { sheet: OddsSheet }) {
  // Optional vendor branding the vendor can type in; printed if filled.
  const [shopName, setShopName] = useState("");

  const chanceWord = sheet.chances === 1 ? sheet.chanceWord : sheet.chanceWordPlural;

  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      {/* On-screen controls — hidden when printing. */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="size-4" /> Back to calculator
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" /> Print / Save as PDF
        </Button>
      </div>

      <div className="no-print mb-6">
        <Label htmlFor="shop-name" className="text-sm text-muted-foreground">
          Shop or event name (optional — prints at the top)
        </Label>
        <Input
          id="shop-name"
          className="mt-1 max-w-sm"
          placeholder="e.g. Main Street Cards — Summer Regionals"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />
      </div>

      {/* The sheet itself — this is what prints. */}
      <article className="rounded-lg border bg-card p-6 text-card-foreground sm:p-8">
        <header className="border-b pb-4">
          {shopName.trim() && (
            <p className="text-sm font-medium text-muted-foreground">
              {shopName.trim()}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {sheet.gameName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sheet.gameTypeName} · Official odds
          </p>
        </header>

        {/* Top-line facts a player wants first. */}
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <Fact label="Price per chance" value={formatUSD(sheet.buyIn)} />
          <Fact
            label={`Total ${chanceWord}`}
            value={formatNumber(sheet.chances)}
          />
          <Fact label="Total prize value" value={formatUSD(sheet.poolValue)} />
        </dl>

        {sheet.singleWinner && (
          <p className="mt-4 rounded-md bg-muted/50 px-3 py-2 text-sm">
            This is a single-winner raffle: <strong>one</strong> winning{" "}
            {sheet.chanceWord} takes the prize; every other {sheet.chanceWord}{" "}
            wins nothing.
          </p>
        )}

        {/* The prize table — value + odds for each prize. */}
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-3 font-semibold">Prize</th>
              <th className="py-2 pr-3 text-right font-semibold">Value</th>
              <th className="py-2 pr-3 text-right font-semibold">In pool</th>
              <th className="py-2 text-right font-semibold">Odds per chance</th>
            </tr>
          </thead>
          <tbody>
            {sheet.lines.map((line, i) => {
              const oneIn = oneInText(line.probability);
              return (
                <tr key={`${line.name}-${i}`} className="border-b last:border-0">
                  <td className="py-2 pr-3">{line.name}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {line.marketValue > 0 ? formatUSD(line.marketValue) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatNumber(line.quantity)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatPercent(line.probability)}
                    {oneIn && (
                      <span className="ml-1 text-muted-foreground">({oneIn})</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* The headline "feel" number a vendor may want to advertise. */}
        <p className="mt-4 text-sm">
          <strong>{formatPercent(sheet.hitRate)}</strong> of {sheet.chanceWordPlural}{" "}
          win a prize worth at least the {formatUSD(sheet.buyIn)} buy-in.
        </p>

        <footer className="mt-6 border-t pt-3 text-xs text-muted-foreground">
          <p>
            Odds shown are per single {sheet.chanceWord}, based on the full pool
            of {formatNumber(sheet.chances)} {sheet.chanceWordPlural}. Prize
            values are estimated market values and may vary. Odds sheet generated
            with {APP_NAME}.
          </p>
        </footer>
      </article>
    </main>
  );
}

/** One labeled top-line fact (price, count, total value). */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
