// ============================================================
// Engine tests — the safety net under the product.
//
// Plain English: the calculation engine IS MysteryCalc, so it gets the
// most testing. These checks prove every formula, reproduce the
// official "worked example" exactly (the acceptance test the whole
// sprint is measured against), confirm the every-chance-wins filler
// rule and the razz special case, verify the three ways of reading the
// vendor's cut all agree, and make sure bad inputs fail LOUDLY instead
// of returning a quietly-wrong number.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  solveGame,
  marginFor,
  priceFor,
  chancesFor,
  breakEven,
  poolValue,
  poolCost,
  prizeCount,
  nonFillerCount,
  fillerNeeded,
  balanceFiller,
  EngineError,
  type PrizeItem,
  type GameConfig,
} from "@/lib/engine";

// --- Small builders so the tests read like the spec, not like code ---

let nextId = 0;
function item(partial: Partial<PrizeItem>): PrizeItem {
  return {
    id: `i${nextId++}`,
    name: "Item",
    type: "single",
    marketValue: 0,
    cost: 0,
    quantity: 1,
    ...partial,
  };
}

/**
 * The official worked-example pool:
 * 1 slab @ $600 + 4 ETBs @ $50 + 95 filler packs @ $4  →  V = $1,180.
 * Costs are chosen so profit/break-even are also checkable:
 * slab $300, ETB $35, filler $1  →  C = 300 + 140 + 95 = $535.
 */
function workedExamplePool(): PrizeItem[] {
  return [
    item({ name: "PSA 10 slab", type: "slab", marketValue: 600, cost: 300, quantity: 1 }),
    item({ name: "ETB", type: "sealed", marketValue: 50, cost: 35, quantity: 4 }),
    item({ name: "Common pack", type: "filler", marketValue: 4, cost: 1, quantity: 95, isFiller: true }),
  ];
}

// ============================================================
// 1. The three core formulas, in isolation.
// ============================================================
describe("core formulas", () => {
  it("marginFor: m = 1 − V/(N×P)", () => {
    // V=1180, N=100, P=20 → 1 − 1180/2000 = 0.41
    expect(marginFor(1180, 100, 20)).toBeCloseTo(0.41, 10);
  });

  it("priceFor: P = V/(N×(1−m))", () => {
    // V=1180, N=100, m=0.35 → 1180/(100×0.65) = 18.1538…
    expect(priceFor(1180, 100, 0.35)).toBeCloseTo(18.153846, 5);
  });

  it("chancesFor: N = V/(P×(1−m))", () => {
    // V=1180, P=20, m=0.35 → 1180/(20×0.65) = 90.769… (exact, unrounded)
    expect(chancesFor(1180, 20, 0.35)).toBeCloseTo(90.769231, 5);
  });

  it("breakEven: ceil(C/P)", () => {
    expect(breakEven(535, 20)).toBe(27); // 535/20 = 26.75 → 27
    expect(breakEven(100, 20)).toBe(5); // exact division, no rounding up
  });

  it("margin can be negative (generous game) without throwing", () => {
    // Pool worth more than revenue: V=1180, N=10, P=20 → revenue 200
    expect(marginFor(1180, 10, 20)).toBeCloseTo(1 - 1180 / 200, 10);
  });
});

// ============================================================
// 2. Pool totals + filler auto-balance (Σ quantities = N).
// ============================================================
describe("pool totals and filler", () => {
  it("adds up V, C, and prize count", () => {
    const pool = workedExamplePool();
    expect(poolValue(pool)).toBe(1180);
    expect(poolCost(pool)).toBe(535);
    expect(prizeCount(pool)).toBe(100);
    expect(nonFillerCount(pool)).toBe(5); // slab + 4 ETBs
  });

  it("fillerNeeded tops the real prizes up to N", () => {
    const reals = [
      item({ name: "slab", marketValue: 600, quantity: 1 }),
      item({ name: "ETB", marketValue: 50, quantity: 4 }),
    ];
    expect(fillerNeeded(reals, 100)).toBe(95);
  });

  it("balanceFiller produces a pool with exactly N prizes", () => {
    const reals = [
      item({ name: "slab", marketValue: 600, cost: 300, quantity: 1 }),
      item({ name: "ETB", marketValue: 50, cost: 35, quantity: 4 }),
    ];
    const filler = { id: "f", name: "Common pack", type: "filler" as const, marketValue: 4, cost: 1 };
    const balanced = balanceFiller(reals, filler, 100);
    expect(prizeCount(balanced)).toBe(100);
    expect(poolValue(balanced)).toBe(1180);
  });

  it("balanceFiller replaces stale filler rather than stacking it", () => {
    const filler = { id: "f", name: "Common pack", type: "filler" as const, marketValue: 4, cost: 1 };
    let pool = balanceFiller(workedExamplePool(), filler, 100);
    expect(prizeCount(pool)).toBe(100);
    // Re-balance to a bigger game; filler should grow, not duplicate.
    pool = balanceFiller(pool, filler, 200);
    expect(prizeCount(pool)).toBe(200);
    expect(pool.filter((i) => i.isFiller)).toHaveLength(1);
  });

  it("balanceFiller throws if real prizes already exceed N", () => {
    const reals = [item({ name: "slab", marketValue: 600, quantity: 10 })];
    const filler = { id: "f", name: "x", type: "filler" as const, marketValue: 4, cost: 1 };
    expect(() => balanceFiller(reals, filler, 5)).toThrowError(EngineError);
  });

  it("balanceFiller is pure — it does not mutate the input", () => {
    const reals = [item({ name: "slab", marketValue: 600, quantity: 1 })];
    const before = JSON.stringify(reals);
    const filler = { id: "f", name: "x", type: "filler" as const, marketValue: 4, cost: 1 };
    balanceFiller(reals, filler, 100);
    expect(JSON.stringify(reals)).toBe(before);
  });
});

// ============================================================
// 3. THE WORKED EXAMPLE — the acceptance test (must reproduce exactly).
// ============================================================
describe("worked example (acceptance test)", () => {
  it("at N=100, P=$20 → margin 41%", () => {
    const r = solveGame(workedExamplePool(), {
      gameType: "wallOfSleeves",
      solveFor: "targetMargin",
      chances: 100,
      buyIn: 20,
    });
    expect(r.poolValue).toBe(1180);
    expect(r.revenue).toBe(2000);
    expect(r.marginPct).toBeCloseTo(0.41, 10);
    expect(r.playerAvgValue).toBeCloseTo(11.8, 10);
  });

  it("target 35% at P=$20 → 91 chances (rounded up)", () => {
    const r = solveGame(workedExamplePool(), {
      gameType: "wallOfSleeves",
      solveFor: "chances",
      buyIn: 20,
      targetMargin: 0.35,
    });
    expect(r.chances).toBe(91); // ceil(90.769…)
    // Rounding up keeps realized margin at or just above target.
    expect(r.marginPct).toBeGreaterThanOrEqual(0.35);
    expect(r.marginPct).toBeCloseTo(0.3516, 3);
  });

  it("hit rate, tiers, and break-even match a hand-check", () => {
    const r = solveGame(workedExamplePool(), {
      gameType: "wallOfSleeves",
      solveFor: "targetMargin",
      chances: 100,
      buyIn: 20,
    });
    // 5 of 100 chances (slab + 4 ETBs) are worth ≥ $20.
    expect(r.hitRate).toBeCloseTo(0.05, 10);
    // chase = worth > 5×$20=$100 (the slab); win = $20–$100 (4 ETBs);
    // dud = worth < $20 (95 filler packs).
    expect(r.tiers).toEqual({ chase: 1, win: 4, dud: 95 });
    // One big chase among many cheap fillers ⇒ very swingy.
    expect(r.volatility).toBe("high");
    // C=535, P=20 → ceil(26.75)=27.
    expect(r.breakEvenChances).toBe(27);
  });
});

// ============================================================
// 4. The three readings of the cut all agree on the same outcome.
// ============================================================
describe("cut three ways agree", () => {
  it("margin %, profit $, and pool multiple are mutually consistent", () => {
    const r = solveGame(workedExamplePool(), {
      gameType: "wallOfSleeves",
      solveFor: "targetMargin",
      chances: 100,
      buyIn: 20,
    });
    // margin % is exactly 1 − V/revenue
    expect(r.marginPct).toBeCloseTo(1 - r.poolValue / r.revenue, 10);
    // profit $ is revenue minus the cost the vendor actually paid
    expect(r.profit).toBe(r.revenue - r.poolCost); // 2000 − 535 = 1465
    expect(r.profit).toBe(1465);
    // pool multiple is revenue ÷ pool value
    expect(r.poolMultiple).toBeCloseTo(r.revenue / r.poolValue, 10);
  });

  it("solving for buy-in hits the target margin exactly", () => {
    const r = solveGame(workedExamplePool(), {
      gameType: "wallOfSleeves",
      solveFor: "buyIn",
      chances: 100,
      targetMargin: 0.35,
    });
    expect(r.buyIn).toBeCloseTo(18.153846, 5);
    expect(r.marginPct).toBeCloseTo(0.35, 10); // exact: price isn't rounded
  });
});

// ============================================================
// 5. Razz — the single-winner special case (1 prize, N spots).
// ============================================================
describe("razz special case", () => {
  function razzPool(): PrizeItem[] {
    return [item({ name: "Charizard", type: "single", marketValue: 500, cost: 300, quantity: 1 })];
  }

  it("computes margin with one prize and N spots", () => {
    const r = solveGame(razzPool(), {
      gameType: "razz",
      solveFor: "targetMargin",
      chances: 100,
      buyIn: 20,
    });
    expect(r.poolValue).toBe(500);
    expect(r.revenue).toBe(2000);
    expect(r.marginPct).toBeCloseTo(0.75, 10); // 1 − 500/2000
  });

  it("exactly one spot wins; the rest win nothing", () => {
    const r = solveGame(razzPool(), {
      gameType: "razz",
      solveFor: "targetMargin",
      chances: 100,
      buyIn: 20,
    });
    expect(r.hitRate).toBeCloseTo(0.01, 10); // 1 winner in 100
    expect(r.tiers).toEqual({ chase: 1, win: 0, dud: 99 }); // 99 no-prize spots
    expect(r.volatility).toBe("high");
  });

  it("odds list the prize at 1/N and the losing odds at (N−1)/N", () => {
    const r = solveGame(razzPool(), {
      gameType: "razz",
      solveFor: "targetMargin",
      chances: 100,
      buyIn: 20,
    });
    expect(r.perPrizeOdds).toEqual([
      { name: "Charizard", quantity: 1, probability: 0.01 },
      { name: "No prize", quantity: 99, probability: 0.99 },
    ]);
  });

  it("does NOT require Σ quantities = N (no filler warning for razz)", () => {
    const r = solveGame(razzPool(), {
      gameType: "razz",
      solveFor: "targetMargin",
      chances: 100,
      buyIn: 20,
    });
    expect(r.warnings.some((w) => w.includes("filler"))).toBe(false);
  });
});

// ============================================================
// 6. Warnings — soft notices that don't stop the math.
// ============================================================
describe("warnings", () => {
  it("warns when prize cost is $0", () => {
    const pool = [item({ name: "slab", marketValue: 600, cost: 0, quantity: 100 })];
    const r = solveGame(pool, { gameType: "oripa", solveFor: "targetMargin", chances: 100, buyIn: 20 });
    expect(r.warnings.some((w) => w.toLowerCase().includes("cost"))).toBe(true);
  });

  it("warns when an every-chance-wins pool isn't balanced to N", () => {
    // Only 5 real prizes but a 100-chance game.
    const pool = [
      item({ name: "slab", marketValue: 600, cost: 300, quantity: 1 }),
      item({ name: "ETB", marketValue: 50, cost: 35, quantity: 4 }),
    ];
    const r = solveGame(pool, { gameType: "wallOfSleeves", solveFor: "targetMargin", chances: 100, buyIn: 20 });
    expect(r.warnings.some((w) => w.includes("filler"))).toBe(true);
  });

  it("warns when the margin comes out negative", () => {
    const r = solveGame(workedExamplePool(), {
      gameType: "wallOfSleeves",
      solveFor: "targetMargin",
      chances: 10, // tiny game: revenue 200 < pool 1180
      buyIn: 20,
    });
    expect(r.marginPct).toBeLessThan(0);
    expect(r.warnings.some((w) => w.toLowerCase().includes("negative"))).toBe(true);
  });
});

// ============================================================
// 7. Edge cases — must fail LOUDLY, never silently.
// ============================================================
describe("edge cases fail loudly", () => {
  const validConfig: GameConfig = {
    gameType: "oripa",
    solveFor: "targetMargin",
    chances: 100,
    buyIn: 20,
  };

  it("throws on an empty pool", () => {
    expect(() => solveGame([], validConfig)).toThrowError(EngineError);
  });

  it("throws on a pool whose quantities are all zero", () => {
    const pool = [item({ name: "x", marketValue: 10, quantity: 0 })];
    expect(() => solveGame(pool, validConfig)).toThrowError(EngineError);
  });

  it("throws when the pool's total market value is $0", () => {
    const pool = [item({ name: "freebie", marketValue: 0, cost: 1, quantity: 100 })];
    expect(() => solveGame(pool, validConfig)).toThrow(/market value/i);
  });

  it("throws on a negative quantity", () => {
    const pool = [item({ name: "x", marketValue: 10, quantity: -5 })];
    expect(() => solveGame(pool, validConfig)).toThrowError(EngineError);
  });

  it("throws when target margin ≥ 100%", () => {
    const pool = workedExamplePool();
    expect(() =>
      solveGame(pool, { gameType: "oripa", solveFor: "buyIn", chances: 100, targetMargin: 1 }),
    ).toThrow(/margin/i);
  });

  it("throws when N ≤ 0 is given", () => {
    const pool = workedExamplePool();
    expect(() =>
      solveGame(pool, { gameType: "oripa", solveFor: "targetMargin", chances: 0, buyIn: 20 }),
    ).toThrowError(EngineError);
  });

  it("throws when a required input is missing", () => {
    const pool = workedExamplePool();
    // solveFor chances but no buy-in provided.
    expect(() =>
      solveGame(pool, { gameType: "oripa", solveFor: "chances", targetMargin: 0.35 }),
    ).toThrow(/exactly two/i);
  });

  it("error carries a machine-readable code", () => {
    try {
      solveGame([], validConfig);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(EngineError);
      expect((e as EngineError).code).toBe("EMPTY_POOL");
    }
  });
});
