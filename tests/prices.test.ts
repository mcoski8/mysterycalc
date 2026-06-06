// ============================================================
// Price-extraction tests — the pure heart of Phase 4 (price lookup).
//
// Plain English: the only tricky, rules-y part of price lookup is turning a
// messy API card into one clean "here's its market value" row. These tests
// pin down those rules without touching the network:
//  - which printing variant's price we pick,
//  - which price field (market vs mid vs low) we trust,
//  - and that cards with no price come back as "no price" (→ manual entry).
// ============================================================

import { describe, it, expect } from "vitest";
import { pickMarketValue, rawToCandidate, type RawCard } from "@/lib/prices/extract";

describe("pickMarketValue — choosing one price from many", () => {
  it("prefers the sold-derived 'market' field over mid/low", () => {
    const picked = pickMarketValue({
      holofoil: { low: 10, mid: 18, high: 40, market: 22.5, directLow: 9 },
    });
    expect(picked).toEqual({ value: 22.5, label: "holofoil · market" });
  });

  it("falls back to mid, then low, when market is missing/null", () => {
    expect(pickMarketValue({ normal: { market: null, mid: 5.5, low: 3 } })).toEqual({
      value: 5.5,
      label: "normal · mid",
    });
    expect(pickMarketValue({ normal: { market: null, mid: null, low: 3 } })).toEqual({
      value: 3,
      label: "normal · low",
    });
  });

  it("prefers a standard printing over a scarce 1st-edition printing", () => {
    // gym2-2 (Blaine's Charizard) shape: 1st edition is pricier, but the
    // everyday unlimited copy is the more representative value for a prize.
    const picked = pickMarketValue({
      "1stEditionHolofoil": { market: 894.61 },
      unlimitedHolofoil: { market: 534.04 },
    });
    expect(picked?.value).toBe(534.04);
    expect(picked?.label).toBe("unlimited holofoil · market");
  });

  it("ignores zero / non-finite prices and treats them as no price", () => {
    expect(pickMarketValue({ normal: { market: 0, mid: 0, low: 0 } })).toBeNull();
    expect(pickMarketValue({})).toBeNull();
    expect(pickMarketValue(null)).toBeNull();
    expect(pickMarketValue(undefined)).toBeNull();
  });

  it("uses an unknown variant key if it's the only one with a price", () => {
    const picked = pickMarketValue({ someNewVariant: { market: 12 } });
    expect(picked).toEqual({ value: 12, label: "some new variant · market" });
  });
});

describe("rawToCandidate — shaping one API card", () => {
  const raw: RawCard = {
    id: "swsh4-25",
    name: "Charizard",
    number: "25",
    rarity: "Rare Holo",
    set: { name: "Vivid Voltage" },
    images: { small: "https://images.pokemontcg.io/swsh4/25.png" },
    tcgplayer: {
      updatedAt: "2026/06/06",
      prices: { holofoil: { market: 30.12, mid: 28 } },
    },
  };

  it("maps the fields and carries the chosen market value + label", () => {
    const c = rawToCandidate(raw);
    expect(c).toMatchObject({
      id: "swsh4-25",
      name: "Charizard",
      setName: "Vivid Voltage",
      number: "25",
      rarity: "Rare Holo",
      imageSmall: "https://images.pokemontcg.io/swsh4/25.png",
      marketValue: 30.12,
      priceLabel: "holofoil · market",
      pricesUpdatedAt: "2026/06/06",
    });
  });

  it("returns marketValue null (→ manual entry) when there is no price", () => {
    const noPrice: RawCard = { ...raw, tcgplayer: { updatedAt: "2026/06/06", prices: {} } };
    const c = rawToCandidate(noPrice);
    expect(c.marketValue).toBeNull();
    expect(c.priceLabel).toBeNull();
    // Don't claim a stale "updated at" when we have no price to show.
    expect(c.pricesUpdatedAt).toBeNull();
  });

  it("survives missing/partial fields without throwing", () => {
    const c = rawToCandidate({ name: "Mystery" });
    expect(c.name).toBe("Mystery");
    expect(c.setName).toBe("—");
    expect(c.marketValue).toBeNull();
    expect(c.id).toContain("Mystery");
  });
});
