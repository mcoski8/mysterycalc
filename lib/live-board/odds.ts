// ============================================================
// Live Game Board — the live numbers the iPad shows (pure & tested).
//
// Plain English: as prizes get pulled, the board has to re-answer three
// questions on the fly — how many chances are left, which big "chase"
// prizes are still up for grabs, and what the odds are RIGHT NOW. This file
// computes all of that from the frozen starting pool plus the current
// state. It deliberately never trusts any odds stored in the database: the
// display recomputes them here every time (the same rule the calculator
// follows), so a stale or tampered row can't show wrong odds.
//
// Pure math: same inputs → same outputs. No React, no network.
// ============================================================

import type { PrizeItem } from "@/lib/types";
import type { LiveCurrentState, LiveGameRow } from "@/lib/live-board/types";

// A prize worth more than 5× the buy-in is a "chase" — the same default
// boundary the calculator's engine uses (lib/engine DEFAULT_TIERS).
export const CHASE_MULTIPLE = 5;

/** The headline "X of N left": chances still to sell, out of the start count. */
export function countLeft(row: LiveGameRow): { remaining: number; total: number } {
  return {
    remaining: Math.max(0, row.current_state.chancesRemaining),
    total: row.initial_chances,
  };
}

/** One row of the live-odds panel: a prize and its current chance of drawing. */
export type LiveOddsLine = {
  id: string;
  name: string;
  remaining: number;
  /** remaining ÷ chances-left — the odds of this prize on the NEXT pull. */
  probability: number;
};

/**
 * Live per-prize odds, computed from what's actually left.
 *
 * In words: for each prize still in the pool, its odds on the next pull are
 * "how many of it remain" ÷ "how many chances are left." We drop prizes that
 * are all gone, and sort the juiciest (highest value) first so the big stuff
 * leads. If no chances remain, every probability is 0 (the game's done).
 */
export function liveOdds(
  row: LiveGameRow,
  state: LiveCurrentState = row.current_state,
): LiveOddsLine[] {
  const chancesLeft = Math.max(0, state.chancesRemaining);
  const lines: LiveOddsLine[] = [];

  for (const item of row.initial_pool) {
    const remaining = state.remaining[item.id] ?? 0;
    if (remaining <= 0) continue; // claimed out — don't list it
    lines.push({
      id: item.id,
      name: item.name,
      remaining,
      probability: chancesLeft > 0 ? remaining / chancesLeft : 0,
    });
  }

  // Highest-value prizes first (by per-unit market value), so the chase leads.
  const valueOf = (id: string) =>
    row.initial_pool.find((i) => i.id === id)?.marketValue ?? 0;
  lines.sort((a, b) => valueOf(b.id) - valueOf(a.id));
  return lines;
}

/** One chase prize and how many of it are still unclaimed. */
export type ChaseLine = {
  id: string;
  name: string;
  marketValue: number;
  remaining: number;
  total: number;
};

/**
 * The "chase prizes left" panel data: every prize worth more than
 * CHASE_MULTIPLE × the buy-in, with how many are still up for grabs.
 *
 * We KEEP fully-claimed chases in the list (showing "0 left") so the display
 * can cross them off dramatically — half the excitement of a prize wall is
 * watching the big ones get taken. Highest value first.
 */
export function chasePrizesLeft(
  row: LiveGameRow,
  state: LiveCurrentState = row.current_state,
): ChaseLine[] {
  const floor = CHASE_MULTIPLE * row.buy_in;
  return row.initial_pool
    .filter((item) => !item.isFiller && item.marketValue > floor)
    .map((item) => ({
      id: item.id,
      name: item.name,
      marketValue: item.marketValue,
      remaining: state.remaining[item.id] ?? 0,
      total: item.quantity,
    }))
    .sort((a, b) => b.marketValue - a.marketValue);
}

/**
 * Total prizes still in the pool (across all lines) — handy for a subtitle
 * like "27 prizes left across 4 kinds." Pure sum over the remaining map.
 */
export function prizesRemaining(state: LiveCurrentState): number {
  return Object.values(state.remaining).reduce((sum, n) => sum + Math.max(0, n), 0);
}

/** Look up the matching PrizeItem for an id (the controller needs the original). */
export function findItem(items: PrizeItem[], id: string): PrizeItem | undefined {
  return items.find((i) => i.id === id);
}
