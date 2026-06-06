// ============================================================
// Prize Pool — the bookkeeping for the vendor's stack of prizes.
//
// Plain English: this is where we add up the pool. Given the list of
// prize lines, it tells you the pool's total market value (V), what
// it cost the vendor (C), and how many prize units there are. It also
// owns the single most important usability trick in the app:
// auto-balancing "filler" so the number of prizes always equals the
// number of chances.
//
// Why that trick matters: in an "every chance wins" game (oripa, wall
// of sleeves, wheel, kuji, slab lot) every chance must contain exactly
// one prize. Vendors naturally list only the exciting prizes ("1 slab,
// 4 ETBs") and forget the other 95 chances each hold *something*. This
// module fills that gap so the math stays honest.
//
// Pure data helpers only — no React, no database. The engine
// (lib/engine) consumes these totals.
// ============================================================

import type { PrizeItem } from "@/lib/types";
import { EngineError } from "@/lib/errors";

/**
 * Total market value of the pool, V.
 * In words: add up (what each item is worth × how many there are).
 * This is the "advertised" pool size and what player odds are measured
 * against. WARNING: filler counts too — a $4 common pack is still worth
 * $4; ignoring filler would overstate the margin.
 */
export function poolValue(items: PrizeItem[]): number {
  return items.reduce((sum, item) => sum + item.marketValue * item.quantity, 0);
}

/**
 * Total cost of the pool, C.
 * In words: add up (what each item cost the vendor × how many). This is
 * the number that drives TRUE profit (revenue − cost), as opposed to the
 * market value that drives how big the pool looks.
 */
export function poolCost(items: PrizeItem[]): number {
  return items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
}

/**
 * How many prize units are in the pool, Σ(quantity).
 * In an every-chance-wins game this must end up equal to N.
 */
export function prizeCount(items: PrizeItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Sum of quantities for the NON-filler lines only (the "real" prizes). */
export function nonFillerCount(items: PrizeItem[]): number {
  return items
    .filter((item) => !item.isFiller)
    .reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Check the pool's numbers are sane before any math runs.
 * Throws EngineError on anything that would make results meaningless:
 * an empty pool, or negative values / quantities. (Cost = 0 is allowed
 * but the engine will warn about it separately.)
 */
export function validatePool(items: PrizeItem[]): void {
  if (items.length === 0 || prizeCount(items) <= 0) {
    throw new EngineError(
      "EMPTY_POOL",
      "Add at least one prize (with a quantity of 1 or more) before calculating.",
    );
  }
  for (const item of items) {
    if (item.quantity < 0 || !Number.isFinite(item.quantity)) {
      throw new EngineError(
        "INVALID_QUANTITY",
        `"${item.name || "Unnamed item"}" has an invalid quantity. Quantities must be zero or more.`,
      );
    }
    if (item.marketValue < 0 || !Number.isFinite(item.marketValue)) {
      throw new EngineError(
        "INVALID_VALUE",
        `"${item.name || "Unnamed item"}" has an invalid market value. Values must be zero or more.`,
      );
    }
    if (item.cost < 0 || !Number.isFinite(item.cost)) {
      throw new EngineError(
        "INVALID_VALUE",
        `"${item.name || "Unnamed item"}" has an invalid cost. Costs must be zero or more.`,
      );
    }
  }
}

/**
 * How many filler units are needed so that prize count = N.
 * In words: take the number of chances and subtract the prizes the
 * vendor already listed; whatever's left is filler.
 *
 *   fillerNeeded = N − Σ(non-filler quantities)
 *
 * GOTCHA: if the vendor already listed MORE real prizes than there are
 * chances, you can't fit them — that's a real error, surfaced by
 * `balanceFiller`, not silently truncated here. This helper just does
 * the subtraction and never returns a negative (it floors at 0).
 */
export function fillerNeeded(items: PrizeItem[], chances: number): number {
  return Math.max(0, chances - nonFillerCount(items));
}

/**
 * Return a NEW pool with the filler line's quantity set so that the
 * total prize count equals N (every-chance-wins games).
 *
 * Plain English: you hand it the current pool, the filler template
 * (e.g. "common pack", $4 market / $1 cost), and the number of chances.
 * It returns the pool with exactly enough filler added to top it up to
 * N — no more, no less. This is what keeps Σ(quantities) = N as the
 * vendor edits the exciting prizes.
 *
 * It does NOT mutate the input (pure function): callers get a fresh
 * array back. If real prizes already exceed N, it throws so the UI can
 * tell the vendor to raise N or remove prizes.
 */
export function balanceFiller(
  items: PrizeItem[],
  filler: Omit<PrizeItem, "quantity" | "isFiller">,
  chances: number,
): PrizeItem[] {
  const realCount = nonFillerCount(items);
  if (realCount > chances) {
    throw new EngineError(
      "PRIZES_EXCEED_CHANCES",
      `You've listed ${realCount} prizes but only ${chances} chances. ` +
        `Raise the number of chances or remove some prizes so they fit.`,
    );
  }

  const needed = chances - realCount; // 0 or more, guaranteed by the check above
  // Keep every non-filler line untouched; replace any existing filler
  // with a single correctly-sized filler line (or none if not needed).
  const withoutFiller = items.filter((item) => !item.isFiller);
  if (needed === 0) return withoutFiller;

  const fillerLine: PrizeItem = {
    ...filler,
    quantity: needed,
    isFiller: true,
  };
  return [...withoutFiller, fillerLine];
}
