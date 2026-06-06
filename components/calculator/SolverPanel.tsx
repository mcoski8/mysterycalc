// ============================================================
// SolverPanel — pick the game, then fix two knobs to solve the third.
//
// Plain English: this is the control panel. The vendor chooses the
// game type (oripa, wall of sleeves, razz…), then picks which of the
// three locked-together numbers to SOLVE FOR — price, number of
// chances, or margin — and types in the other two. The field being
// solved is shown read-only and fills in with the answer.
//
// Pure presentation: it owns no math. It reports the vendor's choices
// up to Calculator.tsx, which runs the engine and passes the solved
// value back down for display.
// ============================================================

"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GAME_TYPE_LIST, type GameType, type SolveFor, type GameTypeMeta } from "@/lib/engine";

type Props = {
  gameType: GameType;
  onGameTypeChange: (g: GameType) => void;
  meta: GameTypeMeta;
  solveFor: SolveFor;
  onSolveForChange: (s: SolveFor) => void;
  buyIn: string;
  chances: string;
  marginPct: string;
  onInputChange: (field: "buyIn" | "chances" | "marginPct", value: string) => void;
  /** The solved value, formatted for display, or null if not yet solvable. */
  solvedDisplay: string | null;
};

// The three knobs, in display order, with the field each maps to.
const KNOBS: { key: SolveFor; field: "buyIn" | "chances" | "marginPct"; label: string }[] = [
  { key: "buyIn", field: "buyIn", label: "Buy-in price" },
  { key: "chances", field: "chances", label: "# of chances" },
  { key: "targetMargin", field: "marginPct", label: "Target margin" },
];

export function SolverPanel({
  gameType,
  onGameTypeChange,
  meta,
  solveFor,
  onSolveForChange,
  buyIn,
  chances,
  marginPct,
  onInputChange,
  solvedDisplay,
}: Props) {
  const values = { buyIn, chances, marginPct };
  const unit = { buyIn: "$", chances: `# ${meta.chanceWordPlural}`, marginPct: "%" };

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
        <p className="text-sm text-muted-foreground">
          {meta.singleWinner
            ? "Single winner: one prize, many spots, exactly one winner."
            : `Every ${meta.chanceWord} wins a prize. Filler tops the pool up to the number of ${meta.chanceWordPlural}.`}
        </p>
      </div>

      {/* Solve-for toggle */}
      <div className="space-y-2">
        <Label>Solve for</Label>
        <div className="grid grid-cols-3 gap-2">
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
          return (
            <div key={knob.key} className="space-y-2">
              <Label htmlFor={`field-${knob.field}`} className="flex items-center justify-between">
                <span>{knob.label}</span>
                <span className="text-xs font-normal text-muted-foreground">{unit[knob.field]}</span>
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
                  placeholder="0"
                  value={values[knob.field]}
                  onChange={(e) => onInputChange(knob.field, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
