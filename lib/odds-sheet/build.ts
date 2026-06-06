// ============================================================
// Odds-Sheet Builder — the customer-facing view, with NO vendor secrets.
//
// Plain English: a vendor's saved game holds everything — including what
// they paid (cost) and what they keep (profit/margin). This file takes
// that saved game and produces the OTHER side of the table: a clean sheet
// a customer would see, showing only the prize pool and the odds of
// pulling each prize. It is the Japanese "here's exactly what's inside and
// your chances" disclosure that builds player trust.
//
// HARD RULE (the whole point of this file): the result NEVER carries the
// vendor's cost, profit, or margin. Those fields are not even built. A test
// (tests/odds-sheet.test.ts) guards this so it can't regress.
//
// It does NO new math. It runs the existing engine (lib/engine) and simply
// re-presents the numbers the engine already computed (per-prize odds, the
// buy-in, the pool's market value, the hit rate).
//
// Reads from: lib/engine (solveGame + game metadata), lib/saved-games
// (snapshotToSolveInput turns a saved game into engine inputs).
// ============================================================

import { solveGame, gameMeta } from "@/lib/engine";
import {
  snapshotToSolveInput,
  type CalculatorSnapshot,
} from "@/lib/saved-games/serialize";

/**
 * One line on the customer sheet: a prize, how many are in the pool, its
 * advertised (market) value, and the chance of pulling it.
 * GOTCHA: `marketValue` is the *advertised* value only — cost is deliberately
 * absent. The odds `probability` is a fraction 0–1 (e.g. 0.04 = 4%).
 */
export type OddsSheetLine = {
  name: string;
  quantity: number;
  marketValue: number;
  probability: number;
};

/**
 * The full customer-facing sheet — a plain, serializable object the page
 * renders. Contains ONLY what a player should see. There is intentionally
 * no cost, no profit, and no margin anywhere in this shape.
 */
export type OddsSheet = {
  gameName: string;
  gameTypeName: string; // e.g. "Wall of sleeves / prize wall"
  chanceWord: string; // e.g. "sleeve"
  chanceWordPlural: string; // e.g. "sleeves"
  buyIn: number; // price per chance, P
  chances: number; // number of chances, N
  poolValue: number; // total advertised pool value, V (market)
  hitRate: number; // fraction of chances worth ≥ the buy-in (0–1)
  /** Razz/raffle: one winner among N spots. Changes the wording on the sheet. */
  singleWinner: boolean;
  lines: OddsSheetLine[];
};

/**
 * Build a customer odds sheet from a saved game + its name.
 *
 * Plain English: hand it a saved game and the name to print at the top.
 * It solves the game with the real engine, then keeps only the customer-
 * safe numbers and the per-prize odds. Anything genuinely broken about the
 * pool (empty, impossible margin) is thrown by the engine as an EngineError
 * — the caller (the route) catches it and shows a friendly message.
 *
 * How per-prize value is attached: the engine's `perPrizeOdds` list carries
 * each prize's name, quantity, and probability, in the SAME order as the
 * saved items — with one trailing "No prize" line for razz. So we read the
 * market value by position from the items, and the trailing razz line (which
 * has no matching item) is simply worth $0.
 */
export function buildOddsSheet(
  snapshot: CalculatorSnapshot,
  name: string,
): OddsSheet {
  const { items, config } = snapshotToSolveInput(snapshot);
  const result = solveGame(items, config); // may throw EngineError — caller handles
  const meta = gameMeta(snapshot.gameType);

  const lines: OddsSheetLine[] = result.perPrizeOdds.map((odds, i) => ({
    name: odds.name,
    quantity: odds.quantity,
    // Items and perPrizeOdds share an order; the only extra entry is razz's
    // trailing "No prize" line, which has no item and is worth nothing.
    marketValue: i < items.length ? items[i].marketValue : 0,
    probability: odds.probability,
  }));

  return {
    gameName: name.trim() || "Mystery game",
    gameTypeName: meta.displayName,
    chanceWord: meta.chanceWord,
    chanceWordPlural: meta.chanceWordPlural,
    buyIn: result.buyIn,
    chances: result.chances,
    poolValue: result.poolValue,
    hitRate: result.hitRate,
    singleWinner: meta.singleWinner,
    lines,
  };
}
