// ============================================================
// Price extraction — turn one raw API card into a clean PriceCandidate.
//
// Plain English: the pokemontcg.io API returns big, messy card objects with
// prices split across printing "variants" (normal, holofoil, 1st edition…),
// each with several numbers (low / mid / high / market). This file does the
// careful, boring work of picking ONE sensible market value and shaping the
// rest into the small PriceCandidate the app uses.
//
// It is PURE (no network, no React) on purpose: the picking rules are the
// part most worth unit-testing, and `pokemontcg.ts` just fetches then calls
// these. Tested in `tests/prices.test.ts`.
// ============================================================

import type { PriceCandidate } from "@/lib/prices/types";

/** The TCGPlayer price block for one printing variant (any field may be null). */
type VariantPrices = {
  low?: number | null;
  mid?: number | null;
  high?: number | null;
  market?: number | null;
  directLow?: number | null;
};

/** The raw card shape we rely on (a loose subset of the API's full object). */
export type RawCard = {
  id?: string;
  name?: string;
  number?: string;
  rarity?: string | null;
  set?: { name?: string } | null;
  images?: { small?: string | null } | null;
  tcgplayer?: {
    updatedAt?: string | null;
    prices?: Record<string, VariantPrices | null> | null;
  } | null;
};

// Which printing variant to trust first. We prefer the everyday, widely
// available printings (a vendor's prize is usually a standard copy) over
// scarce 1st-edition printings, which would over-state a typical card's
// value. Unknown variant keys fall through to "first one with a price."
const VARIANT_PRIORITY = [
  "normal",
  "holofoil",
  "reverseHolofoil",
  "unlimited",
  "unlimitedHolofoil",
  "1stEditionHolofoil",
  "1stEditionNormal",
];

// Within one variant, prefer the sold-derived "market" price; fall back to
// mid, then low, then high. "market" is what TCGPlayer reports as the actual
// going rate, which is what a vendor wants for a prize's worth.
const FIELD_PRIORITY: (keyof VariantPrices)[] = ["market", "mid", "low", "high"];

/** A usable price = a finite number strictly above zero. */
function usable(n: number | null | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

/** Make a variant key human-friendly: "1stEditionHolofoil" → "1st edition holofoil". */
function humanizeVariant(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/1st Edition/i, "1st edition")
    .toLowerCase();
}

/**
 * Pick the single best market value from a TCGPlayer `prices` block.
 * Returns the dollar value plus a plain-English label of where it came
 * from (e.g. "holofoil · market"), or null if no variant has a usable price.
 *
 * The order it tries: walk the preferred variants first, then any remaining
 * variants in the order the API listed them; for each, take the first usable
 * field in {market, mid, low, high}.
 */
export function pickMarketValue(
  prices: Record<string, VariantPrices | null> | null | undefined,
): { value: number; label: string } | null {
  if (!prices) return null;

  const present = Object.keys(prices);
  // Preferred variants that actually exist here, then everything else.
  const ordered = [
    ...VARIANT_PRIORITY.filter((v) => present.includes(v)),
    ...present.filter((v) => !VARIANT_PRIORITY.includes(v)),
  ];

  for (const variant of ordered) {
    const block = prices[variant];
    if (!block) continue;
    for (const field of FIELD_PRIORITY) {
      const n = block[field];
      if (usable(n)) {
        return { value: n, label: `${humanizeVariant(variant)} · ${field}` };
      }
    }
  }
  return null;
}

/**
 * Convert one raw API card into the slim PriceCandidate the UI renders.
 * Cards with no TCGPlayer price come back with marketValue: null (the UI
 * then leaves the dollar field blank for manual entry — the fallback).
 */
export function rawToCandidate(raw: RawCard): PriceCandidate {
  const picked = pickMarketValue(raw.tcgplayer?.prices);
  return {
    id: raw.id ?? `${raw.name ?? "card"}-${raw.number ?? "?"}`,
    name: raw.name ?? "Unknown card",
    setName: raw.set?.name ?? "—",
    number: raw.number ?? "—",
    rarity: raw.rarity ?? null,
    imageSmall: raw.images?.small ?? null,
    marketValue: picked ? picked.value : null,
    priceLabel: picked ? picked.label : null,
    // Only meaningful when we actually have a price.
    pricesUpdatedAt: picked ? raw.tcgplayer?.updatedAt ?? null : null,
  };
}
