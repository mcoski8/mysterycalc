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
import { TcgCsvPriceSource } from "@/lib/prices/tcgcsv";
import { CompositePriceSource } from "@/lib/prices/composite";

export type { PriceSource, PriceQuery, PriceCandidate } from "@/lib/prices/types";
export { ManualPriceSource } from "@/lib/prices/manual";
export { PokemonTcgPriceSource } from "@/lib/prices/pokemontcg";
export { TcgCsvPriceSource } from "@/lib/prices/tcgcsv";
export { CompositePriceSource } from "@/lib/prices/composite";

/**
 * Pick the price source the app should use right now (SERVER-SIDE).
 * Today: a COMPOSITE of two free sources searched together —
 *   1. tcgcsv (SEALED product: booster boxes, ETBs, packs — from our nightly
 *      Supabase index), listed first because mystery prizes are heavily sealed;
 *   2. pokemontcg.io (raw SINGLES, with an optional API key from the
 *      environment that raises rate limits — read here so it never reaches the
 *      browser).
 * If we ever want to disable lookup, return a `ManualPriceSource` instead;
 * everything downstream keeps working (manual entry is always the fallback).
 */
export function getActivePriceSource(): PriceSource {
  // Reserved for an explicit kill-switch later; manual stays a one-liner away.
  void ManualPriceSource;
  return new CompositePriceSource([
    new TcgCsvPriceSource(),
    new PokemonTcgPriceSource(process.env.POKEMONTCG_API_KEY),
  ]);
}
