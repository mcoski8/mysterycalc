// ============================================================
// The Calculation Engine — the heart of MysteryCalc.
//
// Plain English: a "mystery game" takes in money (chances sold ×
// price) and gives out prizes (the pool). Three knobs are locked
// together — the price per chance (P), the number of chances (N), and
// the margin the vendor keeps (m). Fix any two and the third is
// determined. This file does that solving, then describes what the
// resulting game FEELS like to play (how often you win, how swingy it
// is) — because two games with identical margins can feel completely
// different.
//
// It is pure math: same inputs → same outputs, every time. No screens,
// no saving, no internet. That purity is what makes it trustworthy and
// trivially testable.
//
// Reads from: lib/pool (the pool totals), lib/games (per-type facts),
// lib/types (shared shapes), lib/errors (how it fails loudly).
// ============================================================

import type {
  GameConfig,
  GameResult,
  PrizeItem,
  PrizeOdds,
  TierThresholds,
  Volatility,
} from "@/lib/types";
import { EngineError } from "@/lib/errors";
import { gameMeta } from "@/lib/games/game-types";
import {
  poolValue,
  poolCost,
  prizeCount,
  validatePool,
} from "@/lib/pool/pool";

// Default bucket boundary: a prize worth more than 5× the buy-in is a
// "chase." This is a sensible default, not a law — the UI may expose it.
export const DEFAULT_TIERS: TierThresholds = { chaseMultiple: 5 };

// ------------------------------------------------------------
// The three core formulas, each derived from the one master
// relationship:   margin  m = 1 − V / (N × P).
// Solving that equation for each variable gives the three below.
// They are exported individually so every one can be unit-tested on
// its own, in isolation from the rest of the engine.
// ------------------------------------------------------------

/**
 * Margin you'd get at a given pool value, chance count, and price.
 * In words: revenue is N×P; the prizes are worth V; the slice you keep
 * is whatever's left over, as a fraction of revenue.
 *   m = 1 − V / (N × P)
 * Can be negative (a "generous" game that gives away more than it takes
 * in) — that's valid, and the caller warns about it.
 */
export function marginFor(
  poolVal: number,
  chances: number,
  price: number,
): number {
  if (chances <= 0) {
    throw new EngineError(
      "NON_POSITIVE_CHANCES",
      "Number of chances must be greater than zero.",
    );
  }
  if (price <= 0) {
    throw new EngineError(
      "NON_POSITIVE_PRICE",
      "Buy-in price must be greater than zero.",
    );
  }
  return 1 - poolVal / (chances * price);
}

/**
 * Price each chance must cost to hit a target margin.
 *   P = V / (N × (1 − m))
 * WARNING: (1 − m) must be > 0, i.e. margin < 1. A margin of 1 claims
 * the prizes are worth $0, which divides by zero.
 */
export function priceFor(
  poolVal: number,
  chances: number,
  margin: number,
): number {
  if (chances <= 0) {
    throw new EngineError(
      "NON_POSITIVE_CHANCES",
      "Number of chances must be greater than zero.",
    );
  }
  assertMarginBelowOne(margin);
  return poolVal / (chances * (1 - margin));
}

/**
 * How many chances to sell to hit a target margin.
 *   N = V / (P × (1 − m))
 * Returned as an exact (possibly fractional) number; the orchestrator
 * rounds UP to a whole chance, since you can't sell a fraction of one.
 * WARNING: same (1 − m) > 0 rule as priceFor.
 */
export function chancesFor(
  poolVal: number,
  price: number,
  margin: number,
): number {
  if (price <= 0) {
    throw new EngineError(
      "NON_POSITIVE_PRICE",
      "Buy-in price must be greater than zero.",
    );
  }
  assertMarginBelowOne(margin);
  return poolVal / (price * (1 - margin));
}

/** Guard shared by the two margin-based solvers. */
function assertMarginBelowOne(margin: number): void {
  if (!(margin < 1)) {
    throw new EngineError(
      "MARGIN_TOO_HIGH",
      "Target margin must be below 100%. A 100% margin would mean the prizes are worth nothing.",
    );
  }
}

/**
 * Break-even count: how many chances must sell for revenue to cover the
 * prize COST (not market value).
 *   breakEvenChances = ceil(C / P)
 * In words: "you stop losing money once this many chances sell."
 */
export function breakEven(cost: number, price: number): number {
  if (price <= 0) {
    throw new EngineError(
      "NON_POSITIVE_PRICE",
      "Buy-in price must be greater than zero.",
    );
  }
  return Math.ceil(cost / price);
}

// ------------------------------------------------------------
// Game "feel" — what the numbers above don't tell you.
// ------------------------------------------------------------

/**
 * One bucket of identical-value chances: "this many chances are each
 * worth this much." Using grouped counts (not a literal array of
 * length N) means a 1,000-chance game costs nothing extra to analyze.
 */
type ChanceGroup = { value: number; count: number };

/**
 * Turn a pool + game type + chance count into the per-chance value
 * distribution the "feel" stats are measured over.
 *  - Every-chance-wins games: each prize line IS a group of chances.
 *  - Razz: ONE winning chance worth the whole listed pool, plus (N−1)
 *    losing chances worth $0. (That's the single-winner structure.)
 */
function chanceGroups(
  items: PrizeItem[],
  chances: number,
  singleWinner: boolean,
): ChanceGroup[] {
  if (singleWinner) {
    const winningValue = poolValue(items); // the one winner takes the lot
    const losers = Math.max(0, chances - 1);
    const groups: ChanceGroup[] = [{ value: winningValue, count: 1 }];
    if (losers > 0) groups.push({ value: 0, count: losers });
    return groups;
  }
  return items.map((item) => ({
    value: item.marketValue,
    count: item.quantity,
  }));
}

/** Total number of chances represented by a set of groups. */
function groupTotal(groups: ChanceGroup[]): number {
  return groups.reduce((sum, g) => sum + g.count, 0);
}

/**
 * Hit rate: the fraction of chances whose prize is worth AT LEAST the
 * buy-in P. This is the headline marketing number — "X% of players win
 * more than they pay."
 */
function hitRate(groups: ChanceGroup[], price: number): number {
  const total = groupTotal(groups);
  if (total <= 0) return 0;
  const winners = groups
    .filter((g) => g.value >= price)
    .reduce((sum, g) => sum + g.count, 0);
  return winners / total;
}

/**
 * Sort chances into three buckets relative to the buy-in:
 *  - chase: worth more than chaseMultiple × P (the big, exciting wins)
 *  - win:   worth between P and chaseMultiple × P (you came out ahead)
 *  - dud:   worth less than P (you paid more than you got)
 */
function tierBuckets(
  groups: ChanceGroup[],
  price: number,
  tiers: TierThresholds,
): { chase: number; win: number; dud: number } {
  const chaseFloor = tiers.chaseMultiple * price;
  let chase = 0;
  let win = 0;
  let dud = 0;
  for (const g of groups) {
    if (g.value > chaseFloor) chase += g.count;
    else if (g.value >= price) win += g.count;
    else dud += g.count;
  }
  return { chase, win, dud };
}

/**
 * Volatility: how swingy the game feels, as Low / Medium / High.
 * Derived from how spread-out the prize values are. We use the
 * "coefficient of variation" — the standard deviation divided by the
 * average prize value — so it's a relative measure (a $600 chase among
 * $4 fillers is wildly swingy; a pile of ~$12 prizes is flat).
 *
 * Thresholds are heuristic defaults: <0.6 low, 0.6–1.5 medium, >1.5 high.
 */
function volatility(groups: ChanceGroup[]): Volatility {
  const total = groupTotal(groups);
  if (total <= 0) return "low";
  const mean = groups.reduce((s, g) => s + g.value * g.count, 0) / total;
  if (mean <= 0) return "low";
  // Population variance: average squared distance from the mean.
  const variance =
    groups.reduce((s, g) => s + g.count * (g.value - mean) ** 2, 0) / total;
  const cv = Math.sqrt(variance) / mean;
  if (cv < 0.6) return "low";
  if (cv <= 1.5) return "medium";
  return "high";
}

/**
 * Per-prize odds — the raw data the customer odds sheet (Phase 3) will
 * render. For every-chance-wins games each item's chance is quantity÷N.
 * For razz, every listed item is part of the single winning draw, so
 * each is 1÷N, and a "No prize" line shows the losing odds.
 */
function perPrizeOdds(
  items: PrizeItem[],
  chances: number,
  singleWinner: boolean,
): PrizeOdds[] {
  if (chances <= 0) return [];
  if (singleWinner) {
    const odds: PrizeOdds[] = items.map((item) => ({
      name: item.name,
      quantity: 1, // the one winner takes this item
      probability: 1 / chances,
    }));
    const losers = Math.max(0, chances - 1);
    if (losers > 0) {
      odds.push({
        name: "No prize",
        quantity: losers,
        probability: losers / chances,
      });
    }
    return odds;
  }
  return items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    probability: item.quantity / chances,
  }));
}

// ------------------------------------------------------------
// The orchestrator — ties it all together.
// ------------------------------------------------------------

/**
 * Solve a full game and return every number a vendor needs.
 *
 * Plain English: hand it the prize pool and a setup that fixes any TWO
 * of {price, chances, margin}. It works out the third, the real profit
 * (using cost, not market value), and the game's "feel," and hands it
 * all back. Anything genuinely broken (empty pool, 100% margin, too
 * many prizes for too few chances) is thrown as an EngineError so it
 * can never slip through as a wrong number; softer notes (cost is $0,
 * pool isn't balanced to N) come back in `warnings`.
 *
 * GOTCHA: the pool value V is taken as-is from the items. When solving
 * for N, V does NOT shrink/grow to match the new N — it's the value of
 * the pool you currently have. This matches the worked example exactly
 * (V=$1,180 stays $1,180 while N is solved).
 */
export function solveGame(
  items: PrizeItem[],
  config: GameConfig,
  tiers: TierThresholds = DEFAULT_TIERS,
): GameResult {
  const warnings: string[] = [];
  const meta = gameMeta(config.gameType);

  // 1) The pool must be sane before anything else.
  validatePool(items);
  const V = poolValue(items);
  const C = poolCost(items);
  const count = prizeCount(items);

  if (V <= 0) {
    throw new EngineError(
      "INVALID_VALUE",
      "The pool's total market value is $0 — add prize values before calculating.",
    );
  }

  // Soft notices the vendor should see but that don't stop the math.
  if (C <= 0) {
    warnings.push(
      "Prize cost is $0 — profit will look like full revenue. Enter what you paid for the prizes to see true profit.",
    );
  }
  if (meta.singleWinner && items.some((i) => i.isFiller)) {
    warnings.push(
      "Razz has no filler — every non-winning spot simply wins nothing. Filler lines are treated as part of the single prize.",
    );
  }

  // 2) Resolve the three locked knobs: take the two provided, solve the
  //    third. `solveFor` says which one is the unknown, with no guessing.
  let N: number;
  let P: number;
  switch (config.solveFor) {
    case "chances": {
      P = requireInput(config.buyIn, "buy-in price");
      const m = requireInput(config.targetMargin, "target margin");
      // Round UP: you can't sell a fraction of a chance, and rounding
      // up keeps you at or above the target margin (never below it).
      N = Math.ceil(chancesFor(V, P, m));
      if (N <= 0) {
        throw new EngineError(
          "NON_POSITIVE_CHANCES",
          "That price and margin imply zero chances — lower the margin or the price.",
        );
      }
      break;
    }
    case "buyIn": {
      N = requireInput(config.chances, "number of chances");
      const m = requireInput(config.targetMargin, "target margin");
      if (N <= 0) {
        throw new EngineError(
          "NON_POSITIVE_CHANCES",
          "Number of chances must be greater than zero.",
        );
      }
      P = priceFor(V, N, m);
      break;
    }
    case "targetMargin": {
      N = requireInput(config.chances, "number of chances");
      P = requireInput(config.buyIn, "buy-in price");
      // marginFor guards N>0 and P>0 itself.
      break;
    }
  }

  // 3) Realized margin: always recompute from the FINAL N and P. After
  //    rounding N up, the true margin is a touch above the target, and
  //    honesty means reporting what the game actually delivers.
  const marginPct = marginFor(V, N, P);
  if (marginPct < 0) {
    warnings.push(
      "Margin is negative — this game gives away more value than it takes in. Players love it; your wallet won't.",
    );
  }

  // 4) For every-chance-wins games, the pool should be balanced so the
  //    prize count equals N. If it isn't, the feel stats are based on the
  //    prizes actually listed — tell the vendor so they're not surprised.
  if (meta.everyChanceWins && count !== N) {
    warnings.push(
      `Heads up: you have ${count} prize${count === 1 ? "" : "s"} but ${N} ${
        N === 1 ? meta.chanceWord : meta.chanceWordPlural
      }. Add filler to reach ${N} for accurate odds and game-feel.`,
    );
  }

  // 5) Game "feel" — measured over the per-chance value distribution.
  const groups = chanceGroups(items, N, meta.singleWinner);
  const revenue = N * P;

  return {
    poolValue: V,
    poolCost: C,
    prizeCount: count,
    chances: N,
    buyIn: P,
    marginPct,
    solvedFor: config.solveFor,
    revenue,
    profit: revenue - C,
    poolMultiple: revenue / V,
    playerAvgValue: V / N,
    breakEvenChances: breakEven(C, P),
    hitRate: hitRate(groups, P),
    tiers: tierBuckets(groups, P, tiers),
    volatility: volatility(groups),
    perPrizeOdds: perPrizeOdds(items, N, meta.singleWinner),
    warnings,
  };
}

/**
 * Small helper: insist that a "given" input is actually present.
 * Turns a forgotten field into a clear, early error instead of a NaN
 * rippling through every formula downstream.
 */
function requireInput(value: number | undefined, label: string): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    throw new EngineError(
      "MISSING_INPUTS",
      `Missing ${label}. Provide exactly two of {price, chances, margin} and solve for the third.`,
    );
  }
  return value;
}
