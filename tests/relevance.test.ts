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

  it("matches a word against the set name (extra), at lower weight than the name", () => {
    // "charizard paldean": "charizard" is the card name, "paldean" the set.
    const viaSet = relevanceScore("Charizard ex", "charizard paldean", "Paldean Fates");
    expect(viaSet).toBeGreaterThan(0); // the set word counts → it's a match

    // A card whose NAME carries both words still outranks the set-only match.
    const viaName = relevanceScore("Charizard Paldean Promo", "charizard paldean", "Some Set");
    expect(viaName).toBeGreaterThan(viaSet);

    // A word in neither name nor set still doesn't match.
    expect(relevanceScore("Pikachu V", "charizard paldean", "Base Set")).toBe(0);
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
