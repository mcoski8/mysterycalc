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

import { Sparkles } from "lucide-react";
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
  type LeadMetric,
} from "@/lib/engine";
import { formatUSD, formatPercent, formatNumber, formatMultiple } from "@/lib/format";
import { PrizePoolEditor, blankRow, type EditorRow } from "./PrizePoolEditor";
import { CardSearch } from "./CardSearch";
import type { PriceCandidate } from "@/lib/prices/types";
import { SolverPanel } from "./SolverPanel";
import { goalToMarginFraction, type GoalUnit } from "@/lib/games/goal";
import { ResultsDashboard } from "./ResultsDashboard";
import { SavedGamesBar } from "./SavedGamesBar";
import type { CalculatorSnapshot } from "@/lib/saved-games/serialize";
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

/**
 * A section heading with a gradient numbered "step" badge. Gives the three
 * cards (set up → build pool → results) a clear, visually consistent order.
 */
function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2.5 text-base">
      <span className="bg-gradient-brand flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm shadow-primary/30">
        {n}
      </span>
      {children}
    </CardTitle>
  );
}

// The calculator can show a "save your games" bar; it needs to know who is
// logged in. The page passes the vendor's email (or null) down from the server.
type Props = {
  userEmail: string | null;
};

export function Calculator({ userEmail }: Props) {
  const [gameType, setGameType] = useState<GameType>("wallOfSleeves");
  const [rows, setRows] = useState<EditorRow[]>(seedRows);
  const [solveFor, setSolveFor] = useState<SolveFor>("targetMargin");
  const [buyIn, setBuyIn] = useState("20");
  const [chances, setChances] = useState("100");
  // The profit goal, and which unit the vendor is expressing it in. The
  // value is whatever that unit means ("35" = 35% margin, "1500" = $1,500
  // profit, "3" = triple your money). The engine only understands margin, so
  // we convert below — see goalMarginFraction.
  const [goalUnit, setGoalUnit] = useState<GoalUnit>("margin");
  const [goalValue, setGoalValue] = useState("35");
  // Which "cut" reading leads on the dashboard (Decision 005). Lifted here
  // so it saves and reopens with a game.
  const [leadMetric, setLeadMetric] = useState<LeadMetric>("percent");

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

  // Convert the profit goal (in whatever unit the vendor picked — %, $, or ×)
  // into the single "margin fraction" the engine works in. The translation
  // itself is a pure, tested helper (lib/games/goal.ts); here we just feed it
  // the live pool totals. `null` means "not enough input yet."
  const goalMarginFraction = useMemo<number | null>(
    () =>
      provided(goalValue)
        ? goalToMarginFraction(goalUnit, num(goalValue), totals.value, totals.cost)
        : null,
    [goalValue, goalUnit, totals.cost, totals.value],
  );

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
      (!needsMargin || goalMarginFraction !== null);
    if (totals.count <= 0 || !haveInputs) return { kind: "incomplete" };

    const config: GameConfig = {
      gameType,
      solveFor,
      buyIn: needsBuyIn ? num(buyIn) : undefined,
      chances: needsChances ? Math.round(num(chances)) : undefined,
      // The profit goal was already converted to a margin fraction above,
      // whatever unit the vendor typed it in.
      targetMargin: needsMargin ? goalMarginFraction! : undefined,
    };

    try {
      const result = solveGame(items, config);
      return { kind: "ok", result };
    } catch (e) {
      const message =
        e instanceof EngineError ? e.message : "Something went wrong calculating this game.";
      return { kind: "error", message };
    }
  }, [items, totals.count, gameType, solveFor, buyIn, chances, goalMarginFraction]);

  // What to show in the read-only "solved" field of the solver panel. When
  // solving for the profit goal we show it in whichever unit the vendor chose
  // (margin %, total $ profit, or money multiple) — same number, their words.
  const solvedDisplay =
    outcome.kind === "ok"
      ? solveFor === "buyIn"
        ? formatUSD(outcome.result.buyIn)
        : solveFor === "chances"
          ? `${formatNumber(outcome.result.chances)} ${meta.chanceWordPlural}`
          : goalUnit === "profit"
            ? formatUSD(outcome.result.profit)
            : goalUnit === "multiple"
              ? formatMultiple(outcome.result.poolMultiple)
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

  // Phase 4 / 4.5: a vendor picked a card or sealed product from the search.
  // Add it as a new, non-filler prize row pre-filled with its name and
  // looked-up market value (blank when it had no price). The prize TYPE follows
  // what they picked — a single card vs. sealed product (booster box, ETB,
  // pack) — which only affects the on-screen label, never the math. Cost and
  // quantity are left for the vendor — we only know market value, not what they
  // paid.
  function handleAddFromCard(candidate: PriceCandidate) {
    const row: EditorRow = {
      ...blankRow(),
      name: candidate.name,
      type: candidate.kind === "sealed" ? "sealed" : "single",
      marketValue: candidate.marketValue !== null ? String(candidate.marketValue) : "",
      // Attribute auto-filled prices to TCGPlayer (both sources report the
      // TCGPlayer market price). Only tag rows that actually got a value.
      priceSource: candidate.marketValue !== null ? "TCGPlayer" : undefined,
      cost: "",
      quantity: "1",
    };
    setRows((prev) => [...prev, row]);
  }

  function handleInputChange(field: "buyIn" | "chances" | "goalValue", value: string) {
    if (field === "buyIn") setBuyIn(value);
    else if (field === "chances") setChances(value);
    else setGoalValue(value);
  }

  // When switching to razz, drop the every-chance-wins filler flag from
  // rows so the seeded filler doesn't masquerade as filler on a format
  // that has none. (It still counts as part of the prize — see engine.)
  function handleGameTypeChange(g: GameType) {
    setGameType(g);
  }

  // A snapshot of everything a saved game needs, kept in sync with the
  // inputs so the SavedGamesBar can save it at any moment.
  // The saved-game format stores the goal as a margin PERCENT string (and
  // blank when solving for it — the engine recomputes it). So we hand the
  // snapshot the EFFECTIVE margin percent, converted from whatever unit the
  // vendor used, keeping the on-disk shape unchanged. GOTCHA: the chosen unit
  // (%/$/×) itself isn't persisted — a reopened game shows its goal as a
  // margin %, which is the same economics.
  const snapshot = useMemo<CalculatorSnapshot>(
    () => ({
      gameType,
      solveFor,
      buyIn,
      chances,
      marginPct:
        solveFor === "targetMargin" || goalMarginFraction === null
          ? ""
          : String(goalMarginFraction * 100),
      rows,
      leadMetric,
    }),
    [gameType, solveFor, buyIn, chances, goalMarginFraction, rows, leadMetric],
  );

  // Reopen a saved game: push every field back into the editor at once. The
  // stored goal is a margin percent, so we restore the unit toggle to "%".
  function applySnapshot(s: CalculatorSnapshot) {
    setGameType(s.gameType);
    setSolveFor(s.solveFor);
    setBuyIn(s.buyIn);
    setChances(s.chances);
    setGoalUnit("margin");
    setGoalValue(s.marginPct);
    setRows(s.rows);
    setLeadMetric(s.leadMetric);
  }

  return (
    <div className="space-y-6">
      <SavedGamesBar snapshot={snapshot} onLoad={applySnapshot} userEmail={userEmail} />

      <div className="grid gap-6 lg:grid-cols-2">
      {/* LEFT: inputs */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <StepTitle n={1}>Set up the game</StepTitle>
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
              goalValue={goalValue}
              goalUnit={goalUnit}
              onGoalUnitChange={setGoalUnit}
              onInputChange={handleInputChange}
              solvedDisplay={solvedDisplay}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <StepTitle n={2}>Build the prize pool</StepTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardSearch onPick={handleAddFromCard} />
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
      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <StepTitle n={3}>Results</StepTitle>
          </CardHeader>
          <CardContent>
            {outcome.kind === "ok" ? (
              <ResultsDashboard
                result={outcome.result}
                meta={meta}
                lead={leadMetric}
                onLeadChange={setLeadMetric}
              />
            ) : outcome.kind === "error" ? (
              <p className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100">
                {outcome.message}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 px-6 py-14 text-center">
                <span className="bg-gradient-brand flex size-12 items-center justify-center rounded-2xl opacity-90 shadow-md shadow-primary/20">
                  <Sparkles className="size-6 text-white" strokeWidth={2.25} />
                </span>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Add at least one prize and fill in the two values above to see
                  your profit, hit rate, and per-prize odds.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
