// ============================================================
// Customer odds-sheet builder tests.
//
// Plain English: prove two things about the sheet a CUSTOMER sees.
//  1) The odds and values are right (it re-presents the engine correctly).
//  2) It NEVER leaks the vendor's private numbers — cost, profit, or margin.
// The second test is the important one: it's the hard rule of this feature,
// guarded here so a future change can't quietly expose vendor economics.
// ============================================================

import { describe, it, expect } from "vitest";
import { buildOddsSheet } from "@/lib/odds-sheet/build";
import type { CalculatorSnapshot } from "@/lib/saved-games/serialize";

// The official worked example: a wall of sleeves at $20 × 100, solving for
// margin. Pool value = 600 + (50×4) + (4×95) = $1,180. (Cost is present in
// the rows but must never reach the sheet.)
const wallSnap: CalculatorSnapshot = {
  gameType: "wallOfSleeves",
  solveFor: "targetMargin",
  buyIn: "20",
  chances: "100",
  marginPct: "", // solved-for → blank on a saved game
  rows: [
    { id: "a", name: "PSA 10 chase", type: "slab", marketValue: "600", cost: "300", quantity: "1" },
    { id: "b", name: "ETB", type: "sealed", marketValue: "50", cost: "35", quantity: "4" },
    { id: "c", name: "Common pack", type: "filler", marketValue: "4", cost: "1", quantity: "95", isFiller: true },
  ],
  leadMetric: "percent",
};

describe("buildOddsSheet — the customer view", () => {
  it("re-presents the worked example correctly", () => {
    const sheet = buildOddsSheet(wallSnap, "Indy Regionals wall");

    expect(sheet.gameName).toBe("Indy Regionals wall");
    expect(sheet.gameTypeName).toBe("Wall of sleeves / prize wall");
    expect(sheet.buyIn).toBe(20);
    expect(sheet.chances).toBe(100);
    expect(sheet.poolValue).toBe(1180);
    expect(sheet.singleWinner).toBe(false);

    // One line per prize, in entry order, with value + odds.
    expect(sheet.lines).toHaveLength(3);
    expect(sheet.lines[0]).toMatchObject({
      name: "PSA 10 chase",
      marketValue: 600,
      quantity: 1,
      probability: 0.01, // 1 ÷ 100
    });
    expect(sheet.lines[1]).toMatchObject({ marketValue: 50, quantity: 4, probability: 0.04 });
    expect(sheet.lines[2]).toMatchObject({ marketValue: 4, quantity: 95, probability: 0.95 });

    // Hit rate: only the chase + the 4 ETBs are worth ≥ $20 → 5 of 100.
    expect(sheet.hitRate).toBeCloseTo(0.05, 10);
  });

  it("NEVER includes the vendor's cost, profit, or margin (the hard rule)", () => {
    const sheet = buildOddsSheet(wallSnap, "Indy Regionals wall");

    // No top-level field names that mean vendor economics.
    const keys = Object.keys(sheet);
    expect(keys).not.toContain("cost");
    expect(keys).not.toContain("poolCost");
    expect(keys).not.toContain("profit");
    expect(keys).not.toContain("margin");
    expect(keys).not.toContain("marginPct");

    // And no prize line carries a cost.
    for (const line of sheet.lines) {
      expect(line).not.toHaveProperty("cost");
    }

    // Belt-and-suspenders: the serialized sheet must not mention those words
    // as keys, and must not contain the prize COST values ($300 / $35 / $1).
    const json = JSON.stringify(sheet);
    expect(json).not.toMatch(/"(cost|poolCost|profit|margin|marginPct)"/i);
    expect(json).not.toContain('"300"');
    expect(json).not.toContain(":300"); // cost-as-number, just in case
  });

  it("handles razz as a single-winner raffle (1 in N + a 'No prize' line)", () => {
    const razzSnap: CalculatorSnapshot = {
      gameType: "razz",
      solveFor: "targetMargin",
      buyIn: "10",
      chances: "50",
      marginPct: "",
      rows: [
        { id: "p", name: "Sealed booster box", type: "sealed", marketValue: "300", cost: "180", quantity: "1" },
      ],
      leadMetric: "percent",
    };
    const sheet = buildOddsSheet(razzSnap, "Booster box razz");

    expect(sheet.singleWinner).toBe(true);
    // One winning prize at 1 ÷ 50, plus a "No prize" line for the other 49.
    expect(sheet.lines).toHaveLength(2);
    expect(sheet.lines[0]).toMatchObject({ name: "Sealed booster box", marketValue: 300, probability: 0.02 });
    expect(sheet.lines[1]).toMatchObject({ name: "No prize", marketValue: 0, quantity: 49 });
    expect(sheet.lines[1].probability).toBeCloseTo(0.98, 10);
  });

  it("works when the saved game solved for chances (solved knob blank)", () => {
    // Oripa at $25, 30% margin, solving for N. V = 600. N = ceil(600 / (25 × 0.70)) = ceil(34.28) = 35.
    const solveChances: CalculatorSnapshot = {
      gameType: "oripa",
      solveFor: "chances",
      buyIn: "25",
      chances: "", // solved-for → blank
      marginPct: "30",
      rows: [
        { id: "x", name: "Chase", type: "slab", marketValue: "600", cost: "400", quantity: "1" },
      ],
      leadMetric: "percent",
    };
    const sheet = buildOddsSheet(solveChances, "Oripa test");
    expect(sheet.chances).toBe(35);
    expect(sheet.buyIn).toBe(25);
    expect(sheet.poolValue).toBe(600);
  });
});
