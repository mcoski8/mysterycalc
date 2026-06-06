// ============================================================
// Calculator — the brain of the page (the only stateful component).
//
// Plain English: this ties the three pieces together. It holds what the
// vendor has typed (the prize list, the game type, which knob to solve
// for, and the two given numbers), runs the pure engine whenever any of
// that changes, and hands the result to the dashboard. If the engine
// can't compute yet (missing inputs) or refuses (a real error), it
// shows a friendly message instead of a wrong number.
//
// All the math lives in lib/engine; this component only gathers inputs
// and displays outputs. It is a Client Component because it manages
// interactive state.
// ============================================================

"use client";

import { useMemo, useState } from "react";
import {
  solveGame,
  poolValue as sumPoolValue,
  poolCost as sumPoolCost,
  prizeCount as sumPrizeCount,
  nonFillerCount,
  gameMeta,
  EngineError,
  type GameType,
  type SolveFor,
  type PrizeItem,
  type GameConfig,
  type GameResult,
} from "@/lib/engine";
import { formatUSD, formatPercent, formatNumber } from "@/lib/format";
import { PrizePoolEditor, blankRow, type EditorRow } from "./PrizePoolEditor";
import { SolverPanel } from "./SolverPanel";
import { ResultsDashboard } from "./ResultsDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ---- Seed data: the official worked example, so the page reproduces
// the 41% acceptance result the moment it loads (and gives the vendor a
// concrete thing to edit instead of a blank screen). ----
function seedRows(): EditorRow[] {
  return [
    { id: "seed-slab", name: "PSA 10 chase", type: "slab", marketValue: "600", cost: "300", quantity: "1" },
    { id: "seed-etb", name: "ETB", type: "sealed", marketValue: "50", cost: "35", quantity: "4" },
    { id: "seed-filler", name: "Common pack", type: "filler", marketValue: "4", cost: "1", quantity: "95", isFiller: true },
  ];
}

/** Parse a text field to a number; blank or junk becomes 0. */
function num(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Is a field a usable, positive-ish number the engine can act on? */
function provided(s: string): boolean {
  return s.trim() !== "" && Number.isFinite(Number.parseFloat(s));
}

/** Convert an editable row into the engine's PrizeItem shape. */
function rowToItem(row: EditorRow): PrizeItem {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    marketValue: num(row.marketValue),
    cost: num(row.cost),
    quantity: Math.round(num(row.quantity)), // chances are whole units
    isFiller: row.isFiller,
  };
}

export function Calculator() {
  const [gameType, setGameType] = useState<GameType>("wallOfSleeves");
  const [rows, setRows] = useState<EditorRow[]>(seedRows);
  const [solveFor, setSolveFor] = useState<SolveFor>("targetMargin");
  const [buyIn, setBuyIn] = useState("20");
  const [chances, setChances] = useState("100");
  const [marginPct, setMarginPct] = useState("35");

  const meta = gameMeta(gameType);

  // The prize list as the engine sees it. Razz has no filler concept, so
  // when on razz we ignore the isFiller flag (the engine treats the whole
  // listed pool as the single prize anyway).
  const items = useMemo(() => rows.map(rowToItem), [rows]);

  // Live pool totals for the editor footer (cheap pure sums).
  const totals = useMemo(
    () => ({
      value: sumPoolValue(items),
      cost: sumPoolCost(items),
      count: sumPrizeCount(items),
    }),
    [items],
  );

  // The number of chances we can balance filler against: it's a known
  // input unless we're solving FOR chances (in which case it's unknown
  // until after the solve).
  const targetChances = solveFor !== "chances" && provided(chances) ? Math.round(num(chances)) : null;

  // Run the engine. We compute a discriminated result so the view can
  // show a friendly "needs more input" state, a real error, or the
  // dashboard — never a half-baked number.
  const outcome = useMemo<
    | { kind: "incomplete" }
    | { kind: "error"; message: string }
    | { kind: "ok"; result: GameResult }
  >(() => {
    // Need a non-empty pool and the two inputs the chosen solve requires.
    const needsBuyIn = solveFor !== "buyIn";
    const needsChances = solveFor !== "chances";
    const needsMargin = solveFor !== "targetMargin";
    const haveInputs =
      (!needsBuyIn || provided(buyIn)) &&
      (!needsChances || provided(chances)) &&
      (!needsMargin || provided(marginPct));
    if (totals.count <= 0 || !haveInputs) return { kind: "incomplete" };

    const config: GameConfig = {
      gameType,
      solveFor,
      buyIn: needsBuyIn ? num(buyIn) : undefined,
      chances: needsChances ? Math.round(num(chances)) : undefined,
      // Margin is entered as a percentage; the engine wants a fraction.
      targetMargin: needsMargin ? num(marginPct) / 100 : undefined,
    };

    try {
      const result = solveGame(items, config);
      return { kind: "ok", result };
    } catch (e) {
      const message =
        e instanceof EngineError ? e.message : "Something went wrong calculating this game.";
      return { kind: "error", message };
    }
  }, [items, totals.count, gameType, solveFor, buyIn, chances, marginPct]);

  // What to show in the read-only "solved" field of the solver panel.
  const solvedDisplay =
    outcome.kind === "ok"
      ? solveFor === "buyIn"
        ? formatUSD(outcome.result.buyIn)
        : solveFor === "chances"
          ? `${formatNumber(outcome.result.chances)} ${meta.chanceWordPlural}`
          : formatPercent(outcome.result.marginPct)
      : null;

  // One-click filler balance: size a single filler line so the prize
  // count equals the target chances. Mirrors the engine's pure helper but
  // works on the editable rows. Real prizes exceeding N surfaces an error
  // via the engine on the next render, so here we just floor at zero.
  function handleBalanceFiller() {
    if (targetChances === null) return;
    const realRows = rows.filter((r) => !r.isFiller);
    const realUnits = nonFillerCount(realRows.map(rowToItem));
    const needed = Math.max(0, targetChances - realUnits);

    // Reuse an existing filler row's value/cost so we don't wipe the
    // vendor's filler pricing; otherwise seed a gentle default.
    const existing = rows.find((r) => r.isFiller);
    if (needed === 0) {
      setRows(realRows);
      return;
    }
    const fillerRow: EditorRow = existing
      ? { ...existing, quantity: String(needed) }
      : { ...blankRow(true), name: "Filler", marketValue: "1", cost: "0", quantity: String(needed) };
    setRows([...realRows, fillerRow]);
  }

  function handleInputChange(field: "buyIn" | "chances" | "marginPct", value: string) {
    if (field === "buyIn") setBuyIn(value);
    else if (field === "chances") setChances(value);
    else setMarginPct(value);
  }

  // When switching to razz, drop the every-chance-wins filler flag from
  // rows so the seeded filler doesn't masquerade as filler on a format
  // that has none. (It still counts as part of the prize — see engine.)
  function handleGameTypeChange(g: GameType) {
    setGameType(g);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* LEFT: inputs */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Set up the game</CardTitle>
          </CardHeader>
          <CardContent>
            <SolverPanel
              gameType={gameType}
              onGameTypeChange={handleGameTypeChange}
              meta={meta}
              solveFor={solveFor}
              onSolveForChange={setSolveFor}
              buyIn={buyIn}
              chances={chances}
              marginPct={marginPct}
              onInputChange={handleInputChange}
              solvedDisplay={solvedDisplay}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Build the prize pool</CardTitle>
          </CardHeader>
          <CardContent>
            <PrizePoolEditor
              rows={rows}
              onRowsChange={setRows}
              poolValue={totals.value}
              poolCost={totals.cost}
              prizeCount={totals.count}
              targetChances={targetChances}
              chanceWordPlural={meta.chanceWordPlural}
              allowsFiller={meta.allowsFiller}
              onBalanceFiller={handleBalanceFiller}
            />
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: results */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Results</CardTitle>
          </CardHeader>
          <CardContent>
            {outcome.kind === "ok" ? (
              <ResultsDashboard result={outcome.result} meta={meta} />
            ) : outcome.kind === "error" ? (
              <p className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100">
                {outcome.message}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add at least one prize and fill in the two values above to see your results.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
