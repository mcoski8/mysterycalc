// ============================================================
// Sealed-classification tests — the riskiest rule in the sealed-pricing feature.
//
// Plain English: the sync has to tell SEALED product (booster boxes, ETBs,
// packs — the things we price) apart from single cards and digital code cards.
// The rule is "a product is sealed when it has NEITHER a Number NOR a Rarity
// field." These tests lock that rule down using REAL shapes pulled live from
// tcgcsv across sets from 1999 to 2026, including the two tricky edge cases that
// a naive "name must contain a keyword" filter would have wrongly dropped.
// ============================================================

import { describe, it, expect } from "vitest";
import { isSealed, productType, type ExtendedDatum } from "@/lib/sealed/classify";

/** Shorthand: build an extendedData list from field names. */
function ext(...names: string[]): ExtendedDatum[] {
  return names.map((name) => ({ name, value: "x" }));
}

describe("isSealed — telling sealed product from singles/code cards", () => {
  it("a single card (has Number) is NOT sealed", () => {
    expect(isSealed(ext("Number", "Rarity", "CardText"))).toBe(false);
  });

  it("a digital Code Card (has Rarity, no Number) is NOT sealed", () => {
    // Verified live: code cards carry Rarity but never a Number.
    expect(isSealed(ext("Rarity", "CardText"))).toBe(false);
  });

  it("a Booster Box (no Number, no Rarity) IS sealed", () => {
    expect(isSealed(ext("CardText"))).toBe(true);
  });

  it("a product with no extended data at all IS treated as sealed", () => {
    expect(isSealed([])).toBe(true);
    expect(isSealed(null)).toBe(true);
    expect(isSealed(undefined)).toBe(true);
  });

  it("is case/space-insensitive about the field names", () => {
    expect(isSealed(ext(" number "))).toBe(false);
    expect(isSealed(ext("RARITY"))).toBe(false);
  });

  it("keeps real sealed product that has NO obvious name keyword (the edge cases)", () => {
    // These two are genuinely sealed but a keyword filter (box/pack/etb…) would
    // have missed them. Field-absence correctly keeps them — Decision 032.
    // "Pokemon 2-Player Starter Set (Revised Base Set Reprint Run)" and
    // "Celebrations Collector Chest" both have only CardText in extendedData.
    expect(isSealed(ext("CardText"))).toBe(true);
  });
});

describe("productType — a tidy label for the picker badge", () => {
  it("labels the common sealed types from the name", () => {
    expect(productType("Perfect Order Booster Box")).toBe("Booster Box");
    expect(productType("Perfect Order Elite Trainer Box")).toBe("Elite Trainer Box");
    expect(productType("Perfect Order Pokemon Center Elite Trainer Box")).toBe(
      "Pokémon Center ETB",
    );
    expect(productType("Perfect Order Booster Pack")).toBe("Booster Pack");
    expect(productType("Perfect Order Booster Bundle")).toBe("Booster Bundle");
    expect(productType("Perfect Order Premium Checklane Blister [Cinderace Line]")).toBe(
      "Blister",
    );
    expect(productType("Perfect Order Build & Battle Box")).toBe("Build & Battle");
  });

  it("falls back to 'Other' for unrecognized names (still indexed, not dropped)", () => {
    expect(productType("Celebrations Collector Chest")).toBe("Collection");
    expect(productType("Some Mystery Thing")).toBe("Other");
    expect(productType("")).toBe("Other");
    expect(productType(null)).toBe("Other");
  });
});
