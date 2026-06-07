// ============================================================
// SolverPanel — pick the game, then fix two knobs to solve the third.
//
// Plain English: this is the control panel. The vendor chooses the
// game type (oripa, wall of sleeves, razz…) — and sees a quick blurb of
// what it is and what it's best for — then picks which of the three
// locked-together numbers to SOLVE FOR: the buy-in price, the number of
// chances, or the PROFIT GOAL. The field being solved is shown read-only
// and fills in with the answer.
//
// The profit goal can be expressed three ways, because vendors think
// about it differently: as a margin %, as a total $ profit ("I want to
// clear $1,500 this weekend"), or as a money multiple ("triple my
// money" = 3×). All three describe the same thing — how much of the
// money taken in you keep — so the calculator converts whichever you
// pick into the one margin number the engine uses.
//
// Pure presentation: it owns no math. It reports the vendor's choices
// up to Calculator.tsx, which runs the engine and passes the solved
// value back down for display.
// ============================================================

"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GAME_TYPE_LIST, type GameType, type SolveFor, type GameTypeMeta } from "@/lib/engine";
import { gameTypeInfo } from "@/lib/games/game-info";
import type { GoalUnit } from "@/lib/games/goal";

type Props = {
  gameType: GameType;
  onGameTypeChange: (g: GameType) => void;
  meta: GameTypeMeta;
  solveFor: SolveFor;
  onSolveForChange: (s: SolveFor) => void;
  buyIn: string;
  chances: string;
  /** The profit-goal value, in whatever unit `goalUnit` says. */
  goalValue: string;
  goalUnit: GoalUnit;
  onGoalUnitChange: (u: GoalUnit) => void;
  onInputChange: (field: "buyIn" | "chances" | "goalValue", value: string) => void;
  /** The solved value, formatted for display, or null if not yet solvable. */
  solvedDisplay: string | null;
};

// The three knobs, in display order, with the field each maps to.
const KNOBS: {
  key: SolveFor;
  field: "buyIn" | "chances" | "goalValue";
  label: string;
}[] = [
  { key: "buyIn", field: "buyIn", label: "Buy-in price" },
  { key: "chances", field: "chances", label: "# of chances" },
  { key: "targetMargin", field: "goalValue", label: "Profit goal" },
];

// The three ways to express the profit goal, with the symbol shown in the
// unit toggle and a one-line plain-English meaning under the field.
const GOAL_UNITS: {
  key: GoalUnit;
  symbol: string;
  label: string;
  help: string;
}[] = [
  { key: "margin", symbol: "%", label: "Margin", help: "% of the money you take in that you keep." },
  { key: "profit", symbol: "$", label: "Profit", help: "Total dollars you want to clear (after prize cost)." },
  { key: "multiple", symbol: "×", label: "Multiple", help: "How many times your money back — 3 = triple it." },
];

export function SolverPanel({
  gameType,
  onGameTypeChange,
  meta,
  solveFor,
  onSolveForChange,
  buyIn,
  chances,
  goalValue,
  goalUnit,
  onGoalUnitChange,
  onInputChange,
  solvedDisplay,
}: Props) {
  const values = { buyIn, chances, goalValue };
  const info = gameTypeInfo(gameType);
  const activeUnit = GOAL_UNITS.find((u) => u.key === goalUnit)!;

  return (
    <div className="space-y-6">
      {/* Game type picker */}
      <div className="space-y-2">
        <Label htmlFor="game-type">Game type</Label>
        <Select value={gameType} onValueChange={(v) => onGameTypeChange(v as GameType)}>
          <SelectTrigger id="game-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GAME_TYPE_LIST.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* What this game is — a quick blurb, "best for", and tags. */}
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm leading-relaxed text-foreground/90">
            {info.summary}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Best for:</span>{" "}
            {info.bestFor}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {info.tags.map((t) => (
              <Badge key={t} variant="secondary" className="font-normal">
                {t}
              </Badge>
            ))}
          </div>
          {info.caution && (
            <p className="mt-3 rounded-md bg-amber-100 px-2.5 py-1.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {info.caution}
            </p>
          )}
        </div>
      </div>

      {/* Solve-for toggle */}
      <div className="space-y-2">
        <Label>Solve for</Label>
        {/* Stack on phones (the labels don't fit three-up at ~390px), three
            across from sm up. */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {KNOBS.map((knob) => (
            <button
              key={knob.key}
              type="button"
              onClick={() => onSolveForChange(knob.key)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                solveFor === knob.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent",
              )}
            >
              {knob.label}
            </button>
          ))}
        </div>
      </div>

      {/* The three numeric fields. The one being solved is read-only. */}
      <div className="grid gap-4 sm:grid-cols-3">
        {KNOBS.map((knob) => {
          const isSolved = solveFor === knob.key;
          const isGoal = knob.field === "goalValue";
          return (
            <div key={knob.key} className="space-y-2">
              <Label
                htmlFor={`field-${knob.field}`}
                className="flex items-center justify-between gap-2"
              >
                <span>{knob.label}</span>
                {/* Buy-in/chances show a static unit; the goal shows a
                    %/$/× selector so the vendor can think in any of them. */}
                {isGoal ? (
                  <span className="inline-flex overflow-hidden rounded-md border">
                    {GOAL_UNITS.map((u) => (
                      <button
                        key={u.key}
                        type="button"
                        title={u.label}
                        aria-label={`Express goal as ${u.label}`}
                        aria-pressed={goalUnit === u.key}
                        onClick={() => onGoalUnitChange(u.key)}
                        className={cn(
                          "px-2 py-0.5 text-xs font-semibold transition-colors",
                          goalUnit === u.key
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {u.symbol}
                      </button>
                    ))}
                  </span>
                ) : (
                  <span className="text-xs font-normal text-muted-foreground">
                    {knob.field === "buyIn" ? "$" : `# ${meta.chanceWordPlural}`}
                  </span>
                )}
              </Label>

              {isSolved ? (
                <div
                  className="flex h-9 items-center rounded-md border border-primary/40 bg-primary/5 px-3 text-sm font-semibold text-primary"
                  aria-live="polite"
                >
                  {solvedDisplay ?? "—"}
                </div>
              ) : (
                <Input
                  id={`field-${knob.field}`}
                  inputMode="decimal"
                  placeholder={isGoal && goalUnit === "multiple" ? "3" : "0"}
                  value={values[knob.field]}
                  onChange={(e) => onInputChange(knob.field, e.target.value)}
                />
              )}

              {/* Plain-English meaning of the chosen goal unit. */}
              {isGoal && (
                <p className="text-xs leading-snug text-muted-foreground">
                  {activeUnit.help}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
