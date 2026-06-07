// ============================================================
// Price-source types — the shared vocabulary for "look up a card's value."
//
// Plain English: in Phase 4 a vendor can type a card name and have its
// market value filled in for them, instead of typing the dollar amount by
// hand. This file defines the shapes everything in that feature speaks:
// what you ask for (a PriceQuery), what comes back (PriceCandidate rows),
// and the tiny interface (PriceSource) that any price provider implements.
//
// Why an interface at all: so the *where the price comes from* (a free API
// today, a different one tomorrow, or nothing/manual) can change without
// touching the UI or the calculator. Everything talks to PriceSource, never
// to a specific provider. Manual typing always stays available as the
// fallback — see `manual.ts` and `docs/modules/price-sources.md`.
//
// GOTCHA: the original spec sketched `getMarketValue(query) -> number`.
// Real card lookup is a *disambiguation* problem ("Charizard" matches
// hundreds of printings), so the realized interface returns a list of
// candidate cards to pick from, each carrying its own market value. See
// Decision 029.
// ============================================================

/** What the vendor is searching for. Just a name for now; room to grow. */
export type PriceQuery = {
  /** The card name (or partial name) the vendor typed. */
  name: string;
  /** Max results to return. The source clamps this to a sane ceiling. */
  pageSize?: number;
};

/**
 * One card the search turned up — enough for the vendor to recognize the
 * right printing and accept its price. Everything here is customer-neutral
 * public catalog data (no vendor cost/profit lives in this feature).
 */
export type PriceCandidate = {
  /** The provider's stable id (e.g. pokemontcg "swsh4-25"); used as a list key. */
  id: string;
  /**
   * Is this a raw SINGLE card or a SEALED product (booster box, ETB, pack…)?
   * Drives the badge in the picker and the prize-row `type` we pre-fill.
   * Singles come from pokemontcg.io; sealed comes from our tcgcsv index.
   */
  kind: "single" | "sealed";
  name: string;
  /** The set/expansion this printing belongs to (e.g. "Vivid Voltage"). */
  setName: string;
  /** The card's number within its set (e.g. "25" or "025/185"). */
  number: string;
  /** Rarity label if known (e.g. "Rare Holo"), else null. */
  rarity: string | null;
  /** A small thumbnail image URL for the picker, or null. */
  imageSmall: string | null;
  /**
   * The best USD market value we could derive, or null if the provider has
   * no price for this card (brand-new cards, oddities) — the UI then leaves
   * the field blank for the vendor to type, honoring manual fallback.
   */
  marketValue: number | null;
  /**
   * Which price we used, in plain words (e.g. "holofoil · market"), so the
   * vendor can see *what* number they're accepting. Null when no price.
   */
  priceLabel: string | null;
  /** When the provider last refreshed prices (e.g. "2026/06/06"), or null. */
  pricesUpdatedAt: string | null;
};

/**
 * Any place the app can get prices from. Manual entry, a free API, a paid
 * one later — all implement this one method. Nothing outside `lib/prices`
 * should know which concrete source is active.
 */
export interface PriceSource {
  /** Stable id: 'manual' | 'pokemontcg' | … (handy for logging/debugging). */
  readonly id: string;
  /**
   * Find cards matching the query. Returns [] when the source can't answer
   * (e.g. the manual source always returns [] → the vendor types the value).
   * Throws only on a real failure the caller should surface (e.g. the API
   * is down) — an empty result is "no matches," not an error.
   */
  search(query: PriceQuery): Promise<PriceCandidate[]>;
}
