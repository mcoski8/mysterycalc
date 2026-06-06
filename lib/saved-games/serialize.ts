// ============================================================
// Saved-games serialization — translate between the calculator and the DB.
//
// Plain English: the calculator holds its state as on-screen text (a game
// type, which knob to solve for, the two typed numbers, and a list of
// prize rows). The database stores that as real numbers across two tables
// (`games` + `prize_items`). This file is the pure, framework-free
// translator both ways. Keeping it pure means we can unit-test it (see
// tests/saved-games.test.ts) and it never touches React or the network.
//
// The one subtlety it owns: of the three locked knobs {buy-in, chances,
// margin}, exactly one is SOLVED FOR and must NOT be stored (the engine
// recomputes it). We store the other two and leave the solved one NULL —
// the no-drift rule the database also enforces with a CHECK constraint.
// ============================================================

import type {
  GameType,
  SolveFor,
  PrizeType,
  PrizeItem,
  GameConfig,
  LeadMetric,
} from "@/lib/engine";
import type { EditorRow } from "@/components/calculator/PrizePoolEditor";

// LeadMetric lives in lib/types.ts (shared vocabulary); re-exported here so
// existing imports from this module keep working.
export type { LeadMetric };

/**
 * A full snapshot of the calculator's editable state — everything needed
 * to recreate a game exactly. Numbers are kept as strings here to match
 * the editor (a field can be blank mid-typing); the solved knob's string
 * is ignored on save and blank on load.
 */
export type CalculatorSnapshot = {
  gameType: GameType;
  solveFor: SolveFor;
  buyIn: string;
  chances: string;
  marginPct: string; // a PERCENT, e.g. "35" means 35%
  rows: EditorRow[];
  leadMetric: LeadMetric;
};

/** A row of the `games` table as returned by Supabase. */
export type GameRow = {
  id: string;
  name: string;
  game_type: GameType;
  solve_for: SolveFor;
  buy_in: number | null;
  chances: number | null;
  target_margin: number | null; // a FRACTION 0–1, e.g. 0.35
  lead_metric: LeadMetric;
  created_at: string;
  updated_at: string;
};

/** A row of the `prize_items` table as returned by Supabase. */
export type PrizeItemRow = {
  id: string;
  game_id: string;
  name: string;
  type: PrizeType;
  market_value: number;
  cost: number;
  quantity: number;
  is_filler: boolean;
  position: number;
};

/** The `games` columns we write on save (id/user_id/timestamps added elsewhere). */
export type GameInsert = {
  name: string;
  game_type: GameType;
  solve_for: SolveFor;
  buy_in: number | null;
  chances: number | null;
  target_margin: number | null;
  lead_metric: LeadMetric;
};

/** The `prize_items` columns we write on save (id added by the DB). */
export type PrizeItemInsert = {
  game_id: string;
  name: string;
  type: PrizeType;
  market_value: number;
  cost: number;
  quantity: number;
  is_filler: boolean;
  position: number;
};

/** Parse a text field to a finite number; blank or junk becomes 0. */
function num(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Trim floating-point noise (0.1+0.2 problems) to a clean number. */
function clean(n: number): number {
  return Number(n.toFixed(6));
}

/**
 * Build the `games` row to save from a calculator snapshot + a chosen name.
 * The knob being solved for is stored as NULL (the engine recomputes it).
 * Margin is converted from a percent ("35") to the fraction the DB holds
 * (0.35).
 */
export function snapshotToGameInsert(
  snapshot: CalculatorSnapshot,
  name: string,
): GameInsert {
  const { solveFor } = snapshot;
  return {
    name: name.trim() || "Untitled game",
    game_type: snapshot.gameType,
    solve_for: solveFor,
    // Store a knob only if it is NOT the one being solved for.
    buy_in: solveFor === "buyIn" ? null : clean(num(snapshot.buyIn)),
    chances: solveFor === "chances" ? null : Math.round(num(snapshot.chances)),
    target_margin:
      solveFor === "targetMargin" ? null : clean(num(snapshot.marginPct) / 100),
    lead_metric: snapshot.leadMetric,
  };
}

/**
 * Build the `prize_items` rows to save for a given game id, preserving the
 * vendor's row order via `position`.
 */
export function snapshotToPrizeInserts(
  snapshot: CalculatorSnapshot,
  gameId: string,
): PrizeItemInsert[] {
  return snapshot.rows.map((row, i) => ({
    game_id: gameId,
    name: row.name,
    type: row.type,
    market_value: clean(num(row.marketValue)),
    cost: clean(num(row.cost)),
    quantity: Math.round(num(row.quantity)),
    is_filler: Boolean(row.isFiller),
    position: i,
  }));
}

/** Turn a saved prize row back into an editable calculator row. */
function prizeRowToEditorRow(row: PrizeItemRow): EditorRow {
  return {
    id: row.id, // reuse the DB id as the React list key
    name: row.name,
    type: row.type,
    marketValue: String(row.market_value),
    cost: String(row.cost),
    quantity: String(row.quantity),
    isFiller: row.is_filler,
  };
}

/**
 * Rebuild a full calculator snapshot from a saved game + its prize rows.
 * The solved-for knob comes back blank (the calculator solves it live);
 * margin is converted from the stored fraction (0.35) back to a percent
 * string ("35"). Prize rows are sorted by their saved position.
 */
export function gameRowToSnapshot(
  game: GameRow,
  items: PrizeItemRow[],
): CalculatorSnapshot {
  const sorted = [...items].sort((a, b) => a.position - b.position);
  return {
    gameType: game.game_type,
    solveFor: game.solve_for,
    // A stored value becomes its text; a NULL (the solved knob) becomes "".
    buyIn: game.buy_in === null ? "" : String(game.buy_in),
    chances: game.chances === null ? "" : String(game.chances),
    marginPct:
      game.target_margin === null ? "" : String(clean(game.target_margin * 100)),
    rows: sorted.map(prizeRowToEditorRow),
    leadMetric: game.lead_metric,
  };
}

/**
 * Convert editor rows to the engine's PrizeItem shape. (Mirrors the helper
 * in Calculator.tsx; here so non-UI code — e.g. tests — can use it too.)
 */
export function editorRowsToItems(rows: EditorRow[]): PrizeItem[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    marketValue: num(row.marketValue),
    cost: num(row.cost),
    quantity: Math.round(num(row.quantity)),
    isFiller: row.isFiller,
  }));
}

/**
 * Turn a SAVED snapshot into the two things the engine needs to solve a
 * game: the prize items and a GameConfig.
 *
 * Plain English: a saved game stores two of the three knobs {buy-in,
 * chances, margin} and leaves the third (the one being "solved for") blank
 * — the engine recomputes it. So here we pass along the two real knobs and
 * leave the solved one `undefined`, exactly as the live calculator does.
 * Margin is stored on screen as a percent string ("35") and the engine
 * wants a fraction (0.35), so we divide by 100.
 *
 * This mirrors the input-assembly in Calculator.tsx, but pure (no React),
 * so the odds-sheet builder and its tests can reuse it. It assumes a
 * COMPLETE saved game (both stored knobs present); the live calculator,
 * which also handles half-typed input, keeps its own guarded version.
 */
export function snapshotToSolveInput(snapshot: CalculatorSnapshot): {
  items: PrizeItem[];
  config: GameConfig;
} {
  const { solveFor } = snapshot;
  const config: GameConfig = {
    gameType: snapshot.gameType,
    solveFor,
    // Pass a knob only if it is NOT the one being solved for.
    buyIn: solveFor === "buyIn" ? undefined : num(snapshot.buyIn),
    chances:
      solveFor === "chances" ? undefined : Math.round(num(snapshot.chances)),
    targetMargin:
      solveFor === "targetMargin" ? undefined : num(snapshot.marginPct) / 100,
  };
  return { items: editorRowsToItems(snapshot.rows), config };
}
