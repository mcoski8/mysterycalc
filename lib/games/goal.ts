// ============================================================
// Profit-goal conversion — one number, three ways to say it.
//
// Plain English: a vendor can describe how much they want to make in three
// different ways, because different people think differently:
//   • Margin %   — "I want to keep 35% of the money that comes in."
//   • Profit $   — "I want to clear $1,500 this weekend."
//   • Multiple × — "I want to triple my money" (3×).
//
// The calculation engine only understands ONE of these — margin, as a
// fraction between 0 and 1. So this tiny pure function translates whichever
// the vendor picked into that margin fraction. Keeping it here (not inside a
// React component) means it's framework-free and unit-tested.
//
// WHY margin can't reach 100%: margin is the slice of REVENUE you keep, so
// 100% would mean the prizes are worth $0 (you give away nothing). That's why
// "triple my money" is NOT "300% margin" — it's a 3× multiple, which is only
// ~66.7% margin. This function is exactly where that translation happens.
// ============================================================

/** The three ways the profit goal can be expressed in the UI. */
export type GoalUnit = "margin" | "profit" | "multiple";

/**
 * Convert a profit goal into the margin fraction (0–1, can be negative for a
 * deliberately generous game) that the engine solves with.
 *
 * Inputs:
 *  - unit:      which way the goal is expressed
 *  - value:     the typed number (35 = 35%, 1500 = $1,500, 3 = 3×)
 *  - poolValue: total market value of the prizes (V)
 *  - poolCost:  what the prizes cost the vendor (C) — only needed for $-profit
 *
 * Returns the margin fraction, or `null` when the goal can't be resolved yet
 * (a blank/zero/negative multiple, or a $-profit goal before the pool has any
 * value to price against). The caller treats `null` as "not enough input."
 *
 * The math, in words:
 *  - margin:   fraction = value / 100
 *  - multiple: revenue must be `value × poolValue`, and margin = 1 − V/revenue
 *              = 1 − 1/value. (2× → 50%, 3× → 66.7%, 5× → 80%.)
 *  - profit:   revenue must cover the prize cost AND leave the desired profit,
 *              so revenue = poolCost + value, and margin = 1 − poolValue/revenue.
 */
export function goalToMarginFraction(
  unit: GoalUnit,
  value: number,
  poolValue: number,
  poolCost: number,
): number | null {
  if (!Number.isFinite(value)) return null;

  if (unit === "margin") {
    return value / 100;
  }

  if (unit === "multiple") {
    // A non-positive multiple is meaningless ("zero times my money").
    if (value <= 0) return null;
    return 1 - 1 / value;
  }

  // unit === "profit": you need to take in enough to cover prize cost + profit.
  const revenue = poolCost + value;
  // Can't price a $0 pool, and revenue must be positive to keep the math sane.
  if (poolValue <= 0 || revenue <= 0) return null;
  return 1 - poolValue / revenue;
}
