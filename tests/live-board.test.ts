// ============================================================
// Live Game Board — pure-logic tests.
//
// Plain English: the live board's trustworthy core is its pure logic — how
// the state changes when a prize is won or a tap is undone, how the live
// odds are recomputed from what's left, and how a typed code is tidied.
// These tests pin down the edge cases that matter at a busy convention
// table: you can't pull a prize that's gone, undo can't invent prizes,
// filler doesn't clutter the wins ticker, and the odds always reflect the
// CURRENT remaining counts (never a stale stored number).
// ============================================================

import { describe, it, expect } from "vitest";
import type { PrizeItem } from "@/lib/types";
import {
  defaultDisplayConfig,
  initialState,
  markWon,
  togglePanel,
  undoWon,
  MAX_RECENT_WINS,
} from "@/lib/live-board/state";
import {
  chasePrizesLeft,
  countLeft,
  liveOdds,
  prizesRemaining,
} from "@/lib/live-board/odds";
import type { LiveGameRow } from "@/lib/live-board/types";
import { isCompleteCode, normalizeCode } from "@/lib/live-board/code";

// A small wall-of-sleeves pool: a $600 chase, 4 ETBs, 95 common fillers = 100.
const POOL: PrizeItem[] = [
  { id: "slab", name: "PSA 10 chase", type: "slab", marketValue: 600, cost: 300, quantity: 1 },
  { id: "etb", name: "ETB", type: "sealed", marketValue: 50, cost: 35, quantity: 4 },
  { id: "filler", name: "Common pack", type: "filler", marketValue: 4, cost: 1, quantity: 95, isFiller: true },
];
const CHANCES = 100;
const BUY_IN = 20;

/** Build a full board row for the odds helpers, given a current state. */
function rowWith(state = initialState(POOL, CHANCES)): LiveGameRow {
  return {
    id: "id-1",
    short_code: "GHK-7QM",
    game_type: "wallOfSleeves",
    buy_in: BUY_IN,
    initial_chances: CHANCES,
    initial_pool: POOL,
    current_state: state,
    display_config: defaultDisplayConfig("Test"),
    created_at: "",
    updated_at: "",
  };
}

describe("initialState", () => {
  it("starts every prize at full quantity and all chances unsold", () => {
    const s = initialState(POOL, CHANCES);
    expect(s.remaining).toEqual({ slab: 1, etb: 4, filler: 95 });
    expect(s.chancesRemaining).toBe(100);
    expect(s.recentWins).toEqual([]);
  });
});

describe("markWon", () => {
  it("knocks one off the prize AND off the chances, and tickers the win", () => {
    const s = markWon(initialState(POOL, CHANCES), POOL[1], 1000);
    expect(s.remaining.etb).toBe(3);
    expect(s.chancesRemaining).toBe(99);
    expect(s.recentWins[0]).toEqual({ name: "ETB", ts: 1000 });
  });

  it("does NOT add filler pulls to the wins ticker (but still spends a chance)", () => {
    const s = markWon(initialState(POOL, CHANCES), POOL[2], 1000);
    expect(s.remaining.filler).toBe(94);
    expect(s.chancesRemaining).toBe(99);
    expect(s.recentWins).toEqual([]);
  });

  it("refuses to pull a prize that's already gone (no negatives)", () => {
    let s = markWon(initialState(POOL, CHANCES), POOL[0], 1); // slab: 1 -> 0
    expect(s.remaining.slab).toBe(0);
    const before = s;
    s = markWon(s, POOL[0], 2); // try again — should be a no-op
    expect(s).toBe(before); // unchanged reference
    expect(s.remaining.slab).toBe(0);
    expect(s.chancesRemaining).toBe(99); // chance not double-spent
  });

  it("keeps the newest win first and caps the ticker length", () => {
    let s = initialState(POOL, 1000);
    // Win the ETB many more times than the cap by faking a big quantity.
    const bigEtb: PrizeItem = { ...POOL[1], quantity: MAX_RECENT_WINS + 10 };
    s = { ...s, remaining: { ...s.remaining, etb: MAX_RECENT_WINS + 10 } };
    for (let i = 0; i < MAX_RECENT_WINS + 5; i++) s = markWon(s, bigEtb, i);
    expect(s.recentWins.length).toBe(MAX_RECENT_WINS);
    // Newest (highest ts) is at the front.
    expect(s.recentWins[0].ts).toBe(MAX_RECENT_WINS + 4);
  });
});

describe("undoWon", () => {
  it("restores the prize, the chance, and removes the latest matching ticker entry", () => {
    let s = markWon(initialState(POOL, CHANCES), POOL[1], 1000);
    s = undoWon(s, POOL[1], CHANCES);
    expect(s.remaining.etb).toBe(4);
    expect(s.chancesRemaining).toBe(100);
    expect(s.recentWins).toEqual([]);
  });

  it("can't undo past the starting quantity (no invented prizes/chances)", () => {
    const start = initialState(POOL, CHANCES);
    const s = undoWon(start, POOL[0], CHANCES); // slab already at full (1)
    expect(s).toBe(start); // unchanged
    expect(s.remaining.slab).toBe(1);
    expect(s.chancesRemaining).toBe(100);
  });

  it("only removes one ticker entry per undo when a prize was won twice", () => {
    let s = initialState(POOL, CHANCES);
    s = markWon(s, POOL[1], 1); // ETB
    s = markWon(s, POOL[1], 2); // ETB again
    expect(s.recentWins.length).toBe(2);
    s = undoWon(s, POOL[1], CHANCES);
    expect(s.recentWins.length).toBe(1);
    expect(s.remaining.etb).toBe(3);
  });
});

describe("togglePanel", () => {
  it("flips one panel without disturbing the others", () => {
    const c = defaultDisplayConfig("X");
    const next = togglePanel(c, "liveOdds");
    expect(next.panels.liveOdds).toBe(false);
    expect(next.panels.countLeft).toBe(true);
    expect(c.panels.liveOdds).toBe(true); // original untouched (pure)
  });
});

describe("live odds (recomputed from remaining)", () => {
  it("countLeft reports chances remaining out of the start total", () => {
    const s = markWon(initialState(POOL, CHANCES), POOL[1], 1);
    expect(countLeft(rowWith(s))).toEqual({ remaining: 99, total: 100 });
  });

  it("computes each prize's odds as remaining ÷ chances-left, value-sorted", () => {
    const lines = liveOdds(rowWith());
    // Highest value (slab) leads.
    expect(lines[0].name).toBe("PSA 10 chase");
    expect(lines[0].probability).toBeCloseTo(1 / 100, 10);
    const etb = lines.find((l) => l.name === "ETB")!;
    expect(etb.probability).toBeCloseTo(4 / 100, 10);
  });

  it("drops claimed-out prizes and tracks remaining as it changes", () => {
    let s = initialState(POOL, CHANCES);
    s = markWon(s, POOL[0], 1); // slab gone
    const lines = liveOdds(rowWith(s));
    expect(lines.find((l) => l.name === "PSA 10 chase")).toBeUndefined();
    const etb = lines.find((l) => l.name === "ETB")!;
    // Odds rise as the denominator (chances left) shrinks: 4 / 99.
    expect(etb.probability).toBeCloseTo(4 / 99, 10);
  });

  it("chase list keeps claimed prizes (showing 0 left) and excludes filler", () => {
    let s = initialState(POOL, CHANCES);
    s = markWon(s, POOL[0], 1); // claim the slab
    const chases = chasePrizesLeft(rowWith(s));
    // $600 > 5×$20=$100 → chase; ETB $50 is not; filler excluded.
    expect(chases.map((c) => c.name)).toEqual(["PSA 10 chase"]);
    expect(chases[0].remaining).toBe(0);
    expect(chases[0].total).toBe(1);
  });

  it("prizesRemaining sums all remaining lines", () => {
    expect(prizesRemaining(initialState(POOL, CHANCES))).toBe(100);
    const s = markWon(initialState(POOL, CHANCES), POOL[2], 1);
    expect(prizesRemaining(s)).toBe(99);
  });

  it("never divides by zero when the game is sold out", () => {
    const sold = { remaining: { etb: 1 }, chancesRemaining: 0, recentWins: [] };
    const lines = liveOdds(rowWith(sold));
    expect(lines[0].probability).toBe(0);
  });
});

describe("code normalization", () => {
  it("uppercases, strips junk, and inserts the dash at six chars", () => {
    expect(normalizeCode("ghk7qm")).toBe("GHK-7QM");
    expect(normalizeCode("ghk-7qm")).toBe("GHK-7QM");
    expect(normalizeCode("  ghk 7qm ")).toBe("GHK-7QM");
  });

  it("returns partial input uppercased while typing", () => {
    expect(normalizeCode("ghk")).toBe("GHK");
  });

  it("recognizes complete vs incomplete codes", () => {
    expect(isCompleteCode("GHK-7QM")).toBe(true);
    expect(isCompleteCode("ghk7qm")).toBe(true);
    expect(isCompleteCode("GHK-7Q")).toBe(false);
  });
});
