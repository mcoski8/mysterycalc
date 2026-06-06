// ============================================================
// Prices barrel — one front door to the price-lookup feature.
//
// Plain English: the rest of the app imports price types and the "active
// source" from here, not from deep file paths. `getActivePriceSource()`
// decides which provider is live (the real API today, manual otherwise) so
// callers never hard-code a specific provider — swapping it later is a
// one-line change here.
// ============================================================

import type { PriceSource } from "@/lib/prices/types";
import { ManualPriceSource } from "@/lib/prices/manual";
import { PokemonTcgPriceSource } from "@/lib/prices/pokemontcg";

export type { PriceSource, PriceQuery, PriceCandidate } from "@/lib/prices/types";
export { ManualPriceSource } from "@/lib/prices/manual";
export { PokemonTcgPriceSource } from "@/lib/prices/pokemontcg";

/**
 * Pick the price source the app should use right now (SERVER-SIDE).
 * Today: always the free pokemontcg.io source, with an optional API key from
 * the environment (raises rate limits) — the key is read here so it never
 * reaches the browser. If we ever want to disable lookup, return a
 * `ManualPriceSource` instead; everything downstream keeps working.
 */
export function getActivePriceSource(): PriceSource {
  // Reserved for an explicit kill-switch later; manual stays a one-liner away.
  void ManualPriceSource;
  return new PokemonTcgPriceSource(process.env.POKEMONTCG_API_KEY);
}
