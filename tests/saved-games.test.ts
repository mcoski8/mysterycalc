// ============================================================
// Saved-games serialization tests.
//
// Plain English: prove that saving a calculator state and loading it back
// returns the same game. The tricky bits we check: the solved-for knob is
// stored as NULL and comes back blank, and margin survives the percent↔
// fraction conversion (35% ⇄ 0.35).
// ============================================================

import { describe, it, expect } from "vitest";
import {
  snapshotToGameInsert,
  snapshotToPrizeInserts,
  gameRowToSnapshot,
  type CalculatorSnapshot,
  type GameRow,
  type PrizeItemRow,
} from "@/lib/saved-games/serialize";

// A representative snapshot: a wall-of-sleeves game solving for margin,
// with two prize rows (one of them filler).
const snap: CalculatorSnapshot = {
  gameType: "wallOfSleeves",
  solveFor: "targetMargin",
  buyIn: "20",
  chances: "100",
  marginPct: "35", // solved-for → must NOT be stored
  rows: [
    { id: "a", name: "PSA 10 chase", type: "slab", marketValue: "600", cost: "300", quantity: "1" },
    { id: "b", name: "Common pack", type: "filler", marketValue: "4", cost: "1", quantity: "95", isFiller: true },
  ],
  leadMetric: "profit",
};

describe("snapshotToGameInsert", () => {
  it("stores the two fixed knobs and NULLs the solved-for one", () => {
    const insert = snapshotToGameInsert(snap, "Indy wall");
    expect(insert.name).toBe("Indy wall");
    expect(insert.game_type).toBe("wallOfSleeves");
    expect(insert.solve_for).toBe("targetMargin");
    expect(insert.buy_in).toBe(20);
    expect(insert.chances).toBe(100);
    expect(insert.target_margin).toBeNull(); // the solved knob is not stored
    expect(insert.lead_metric).toBe("profit");
  });

  it("converts a different solved knob (buyIn) correctly", () => {
    const insert = snapshotToGameInsert({ ...snap, solveFor: "buyIn" }, "x");
    expect(insert.buy_in).toBeNull();
    expect(insert.chances).toBe(100);
    expect(insert.target_margin).toBeCloseTo(0.35, 10);
  });

  it("falls back to a default name when blank", () => {
    expect(snapshotToGameInsert(snap, "   ").name).toBe("Untitled game");
  });
});

describe("snapshotToPrizeInserts", () => {
  it("maps rows to numeric prize rows with positions preserved", () => {
    const items = snapshotToPrizeInserts(snap, "game-1");
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      game_id: "game-1",
      name: "PSA 10 chase",
      type: "slab",
      market_value: 600,
      cost: 300,
      quantity: 1,
      is_filler: false,
      position: 0,
    });
    expect(items[1]).toMatchObject({ is_filler: true, position: 1, quantity: 95 });
  });
});

describe("round trip (save then load)", () => {
  it("rebuilds the same snapshot, with the solved knob blank", () => {
    const gi = snapshotToGameInsert(snap, "Indy wall");
    const pis = snapshotToPrizeInserts(snap, "game-1");

    // Simulate what the database returns (add the ids/user/timestamps it fills in).
    const gameRow: GameRow = {
      id: "game-1",
      name: gi.name,
      game_type: gi.game_type,
      solve_for: gi.solve_for,
      buy_in: gi.buy_in,
      chances: gi.chances,
      target_margin: gi.target_margin,
      lead_metric: gi.lead_metric,
      created_at: "2026-06-05T00:00:00Z",
      updated_at: "2026-06-05T00:00:00Z",
    };
    // Return them out of order to prove `position` sorting works on load.
    const itemRows: PrizeItemRow[] = [
      { id: "ib", ...pis[1] },
      { id: "ia", ...pis[0] },
    ];

    const restored = gameRowToSnapshot(gameRow, itemRows);

    expect(restored.gameType).toBe("wallOfSleeves");
    expect(restored.solveFor).toBe("targetMargin");
    expect(restored.buyIn).toBe("20");
    expect(restored.chances).toBe("100");
    expect(restored.marginPct).toBe(""); // solved knob comes back blank
    expect(restored.leadMetric).toBe("profit");

    // Rows back in entry order with values intact.
    expect(restored.rows.map((r) => r.name)).toEqual(["PSA 10 chase", "Common pack"]);
    expect(restored.rows[1].isFiller).toBe(true);
    expect(restored.rows[0].marketValue).toBe("600");
  });

  it("restores margin from the stored fraction (0.35 → '35')", () => {
    const gameRow: GameRow = {
      id: "g",
      name: "m",
      game_type: "oripa",
      solve_for: "chances",
      buy_in: 25,
      chances: null,
      target_margin: 0.35,
      lead_metric: "percent",
      created_at: "2026-06-05T00:00:00Z",
      updated_at: "2026-06-05T00:00:00Z",
    };
    const restored = gameRowToSnapshot(gameRow, []);
    expect(restored.marginPct).toBe("35");
    expect(restored.chances).toBe(""); // solved knob blank
    expect(restored.buyIn).toBe("25");
  });
});
