// ============================================================
// PrizePoolEditor — where the vendor lists the prizes.
//
// Plain English: this is the table of prizes going into the game. Each
// row is one kind of prize: its name, what it's worth (market value),
// what it cost the vendor, and how many there are. It shows running
// totals (pool value V, pool cost C, prize count) and has a one-click
// "balance filler" button that tops the pool up so the prize count
// matches the number of chances — the central usability trick.
//
// It holds NO math of its own; it edits the list and reads totals from
// the engine's pure helpers (lib/engine). Editable numeric fields are
// kept as text while typing (so a field can be briefly empty) and
// parsed to numbers only when the engine runs — see Calculator.tsx.
// ============================================================

"use client";

import { Plus, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { PrizeType } from "@/lib/engine";
import { formatUSD, formatNumber } from "@/lib/format";

/**
 * The editable shape of one prize row. The numeric columns are stored
 * as strings so the inputs can be empty mid-typing; Calculator.tsx
 * parses them to numbers when it calls the engine.
 */
export type EditorRow = {
  id: string;
  name: string;
  type: PrizeType;
  marketValue: string;
  cost: string;
  quantity: string;
  isFiller?: boolean;
};

const PRIZE_TYPES: PrizeType[] = [
  "single",
  "slab",
  "sealed",
  "pack",
  "voucher",
  "filler",
];

type Props = {
  rows: EditorRow[];
  onRowsChange: (rows: EditorRow[]) => void;
  /** Engine-computed totals for the live footer. */
  poolValue: number;
  poolCost: number;
  prizeCount: number;
  /** The chance count to balance filler against, or null if unknown. */
  targetChances: number | null;
  /** Word for many chances ("sleeves", "spins") — for the footer copy. */
  chanceWordPlural: string;
  /** Whether this game type uses filler (razz does not). */
  allowsFiller: boolean;
  /** One-click: size the filler line so prize count = target chances. */
  onBalanceFiller: () => void;
};

let rowSeq = 0;
/** A fresh, empty prize row (used by the "Add prize" button). */
export function blankRow(isFiller = false): EditorRow {
  return {
    id: `row-${rowSeq++}-${isFiller ? "f" : "p"}`,
    name: "",
    type: isFiller ? "filler" : "single",
    marketValue: "",
    cost: "",
    quantity: isFiller ? "" : "1",
    isFiller,
  };
}

export function PrizePoolEditor({
  rows,
  onRowsChange,
  poolValue,
  poolCost,
  prizeCount,
  targetChances,
  chanceWordPlural,
  allowsFiller,
  onBalanceFiller,
}: Props) {
  // Update a single field on a single row, leaving the rest untouched.
  function updateRow(id: string, patch: Partial<EditorRow>) {
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    onRowsChange(rows.filter((r) => r.id !== id));
  }

  function addRow() {
    onRowsChange([...rows, blankRow()]);
  }

  // Whether the prize count already matches the target (button is a no-op).
  const balanced = targetChances !== null && prizeCount === targetChances;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-40">Prize</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-28 text-right">Market $</TableHead>
              <TableHead className="w-28 text-right">Cost $</TableHead>
              <TableHead className="w-24 text-right">Qty</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label="Prize name"
                      placeholder={row.isFiller ? "Filler (e.g. common pack)" : "Prize name"}
                      value={row.name}
                      onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    />
                    {row.isFiller && (
                      <Badge variant="secondary" className="shrink-0">
                        filler
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {/* Native select keeps rows lightweight; type only drives
                      labels and the odds sheet, never the math. */}
                  <select
                    aria-label="Prize type"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs"
                    value={row.type}
                    onChange={(e) =>
                      updateRow(row.id, { type: e.target.value as PrizeType })
                    }
                  >
                    {PRIZE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <Input
                    aria-label="Market value"
                    inputMode="decimal"
                    className="text-right"
                    placeholder="0"
                    value={row.marketValue}
                    onChange={(e) => updateRow(row.id, { marketValue: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label="Cost"
                    inputMode="decimal"
                    className="text-right"
                    placeholder="0"
                    value={row.cost}
                    onChange={(e) => updateRow(row.id, { cost: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label="Quantity"
                    inputMode="numeric"
                    className="text-right"
                    placeholder="0"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove prize"
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">
                Totals
                <span className="ml-2 font-normal text-muted-foreground">
                  {formatNumber(prizeCount)} prize{prizeCount === 1 ? "" : "s"}
                  {targetChances !== null && (
                    <> / {formatNumber(targetChances)} {chanceWordPlural}</>
                  )}
                </span>
              </TableCell>
              <TableCell />
              <TableCell className="text-right font-medium">{formatUSD(poolValue)}</TableCell>
              <TableCell className="text-right font-medium">{formatUSD(poolCost)}</TableCell>
              <TableCell className="text-right font-medium">{formatNumber(prizeCount)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="size-4" /> Add prize
        </Button>
        {allowsFiller && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBalanceFiller}
            disabled={targetChances === null || balanced}
            title={
              targetChances === null
                ? "Set the number of chances first (or solve for price/margin) to auto-fill."
                : "Add or resize a filler line so the prize count matches the number of chances."
            }
          >
            <Wand2 className="size-4" />
            {balanced ? "Filler balanced ✓" : `Balance filler to ${targetChances ?? "N"}`}
          </Button>
        )}
      </div>
    </div>
  );
}
