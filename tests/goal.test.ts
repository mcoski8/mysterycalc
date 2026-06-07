// ============================================================
// Profit-goal conversion tests.
//
// Plain English: a vendor can state their goal as a margin %, a total $
// profit, or a money multiple (×). These tests prove the translation into the
// engine's single "margin fraction" is correct — and, crucially, that when
// you feed the converted margin back through the real engine you get exactly
// the profit / multiple the vendor asked for. That round-trip is the whole
// promise of the feature, so it's the heart of this file.
// ============================================================

import { describe, it, expect } from "vitest";
import { goalToMarginFraction } from "@/lib/games/goal";
import { solveGame, type PrizeItem, type GameConfig } from "@/lib/engine";

// The seeded worked-example pool: V = $1,180 market, C = $535 cost.
const POOL: PrizeItem[] = [
  { id: "slab", name: "PSA 10 chase", type: "slab", marketValue: 600, cost: 300, quantity: 1 },
  { id: "etb", name: "ETB", type: "sealed", marketValue: 50, cost: 35, quantity: 4 },
  { id: "filler", name: "Common pack", type: "filler", marketValue: 4, cost: 1, quantity: 95, isFiller: true },
];
const V = 1180;
const C = 535;

describe("goalToMarginFraction", () => {
  it("treats margin % as a plain fraction", () => {
    expect(goalToMarginFraction("margin", 35, V, C)).toBeCloseTo(0.35, 10);
  });

  it("converts a money multiple to margin (2× = 50%, 3× = 66.7%, 5× = 80%)", () => {
    expect(goalToMarginFraction("multiple", 2, V, C)).toBeCloseTo(0.5, 10);
    expect(goalToMarginFraction("multiple", 3, V, C)).toBeCloseTo(2 / 3, 10);
    expect(goalToMarginFraction("multiple", 5, V, C)).toBeCloseTo(0.8, 10);
  });

  it("converts a $ profit goal using prize cost + desired profit", () => {
    // Want $1,500 profit: revenue must be C + 1500 = 2035, so margin = 1 − V/R.
    const expected = 1 - V / (C + 1500);
    expect(goalToMarginFraction("profit", 1500, V, C)).toBeCloseTo(expected, 10);
  });

  it("returns null for goals that can't resolve yet", () => {
    expect(goalToMarginFraction("multiple", 0, V, C)).toBeNull(); // 0× is meaningless
    expect(goalToMarginFraction("multiple", -1, V, C)).toBeNull();
    expect(goalToMarginFraction("profit", 1500, 0, C)).toBeNull(); // no pool value yet
    expect(goalToMarginFraction("margin", NaN, V, C)).toBeNull();
  });

  it("allows a negative margin for a deliberately generous game", () => {
    // A 0.5× multiple (give back half again as much value as you take) → −100%.
    expect(goalToMarginFraction("multiple", 0.5, V, C)).toBeCloseTo(-1, 10);
  });
});

describe("goal round-trips through the engine", () => {
  it("a $1,500 profit goal at 100 chances yields exactly $1,500 profit", () => {
    const margin = goalToMarginFraction("profit", 1500, V, C)!;
    const config: GameConfig = {
      gameType: "wallOfSleeves",
      solveFor: "buyIn",
      chances: 100,
      targetMargin: margin,
    };
    const result = solveGame(POOL, config);
    expect(result.profit).toBeCloseTo(1500, 6);
    // And the implied price is revenue / N = (C + 1500) / 100 = $20.35.
    expect(result.buyIn).toBeCloseTo(20.35, 6);
  });

  it("a 3× multiple goal makes revenue 3× the pool value", () => {
    const margin = goalToMarginFraction("multiple", 3, V, C)!;
    const config: GameConfig = {
      gameType: "oripa",
      solveFor: "buyIn",
      chances: 100,
      targetMargin: margin,
    };
    const result = solveGame(POOL, config);
    expect(result.poolMultiple).toBeCloseTo(3, 6);
    expect(result.revenue).toBeCloseTo(3 * V, 6);
  });
});
