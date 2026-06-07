// ============================================================
// Relevance-scoring tests.
//
// Plain English: proves the search ranker puts the obvious best match on top —
// an exact name beats a prefix, a prefix beats a buried substring, and every
// typed word being present beats only some. This is what makes the card/sealed
// search feel like it "found what I meant," not just "everything containing
// these letters."
// ============================================================

import { describe, it, expect } from "vitest";
import { relevanceScore, sortByRelevance } from "@/lib/prices/relevance";

describe("relevanceScore", () => {
  it("ranks exact > prefix > substring > unrelated", () => {
    const q = "charizard ex";
    const exact = relevanceScore("Charizard ex", q);
    const prefix = relevanceScore("Charizard ex Premium Collection", q);
    const buried = relevanceScore("Team Up Charizard ex Box", q);
    const unrelated = relevanceScore("Pikachu V", q);

    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(buried);
    expect(buried).toBeGreaterThan(unrelated);
    expect(unrelated).toBe(0);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(relevanceScore("  CHARIZARD   EX ", "charizard ex")).toBe(
      relevanceScore("Charizard ex", "charizard ex"),
    );
  });

  it("rewards more matched words", () => {
    const both = relevanceScore("Scarlet Violet Booster Box", "scarlet violet");
    const one = relevanceScore("Scarlet Crusade Pack", "scarlet violet");
    expect(both).toBeGreaterThan(one);
  });

  it("prefers a shorter, more specific name on a tie", () => {
    const short = relevanceScore("Mew ex", "mew ex");
    const long = relevanceScore("Mew ex Super Premium Ultra Collection Bundle", "mew ex");
    expect(short).toBeGreaterThan(long);
  });
});

describe("sortByRelevance", () => {
  it("orders best-match-first and is stable within ties", () => {
    const items = [
      { name: "Team Up Charizard ex Box" },
      { name: "Charizard ex" },
      { name: "Pikachu V" },
      { name: "Charizard ex Premium Collection" },
    ];
    const sorted = sortByRelevance(items, "charizard ex", (i) => i.name);
    expect(sorted.map((i) => i.name)).toEqual([
      "Charizard ex",
      "Charizard ex Premium Collection",
      "Team Up Charizard ex Box",
      "Pikachu V",
    ]);
  });
});
