// ============================================================
// TcgCsvPriceSource — looks up SEALED product in our own Supabase index.
//
// Plain English: this is the sealed-product half of the price lookup (booster
// boxes, ETBs, packs…), the things pokemontcg.io can't price. It does NOT call
// tcgcsv live — a nightly job (lib/sealed/sync.ts) has already copied the
// sealed catalog + prices into our `sealed_products` table, so here we just
// search that table by name. Fast, and polite to tcgcsv (one bulk sync, not a
// hit per keystroke).
//
// It runs SERVER-SIDE only (called from /api/prices/search via the composite
// source). Like every price source it implements `search(query) -> candidates`.
//
// FRAGILE: depends on the sealed_products table existing + being populated. If
// the table is empty or Supabase is unreachable, it returns [] (no sealed
// matches) rather than throwing — the singles lookup + manual entry still work.
// ============================================================

import type { PriceCandidate, PriceQuery, PriceSource } from "@/lib/prices/types";
import { readClient } from "@/lib/sealed/db";
import { relevanceScore } from "@/lib/prices/relevance";

// How many sealed matches to return to the UI (it scrolls). And how many to
// pull from the DB first so we can RANK by relevance before trimming — fetching
// a wider net than we show means the best-named match can win even if it isn't
// the most expensive one.
const MAX_RESULTS = 30;
const FETCH_LIMIT = 80;

/** One row as stored in sealed_products (the columns we read). */
type SealedRow = {
  product_id: number;
  name: string;
  set_name: string | null;
  image_url: string | null;
  market_price: number | null;
  product_type: string | null;
  prices_updated_at: string | null;
};

/** Turn a stored sealed row into the same PriceCandidate shape singles use. */
function rowToCandidate(r: SealedRow): PriceCandidate {
  return {
    id: `sealed-${r.product_id}`,
    kind: "sealed",
    name: r.name,
    // Sealed product isn't a numbered card; we reuse setName for the set and
    // leave number/rarity empty (the UI shows the product_type badge instead).
    setName: r.set_name ?? "—",
    number: "",
    rarity: null,
    imageSmall: r.image_url,
    marketValue: typeof r.market_price === "number" ? r.market_price : null,
    // The product type ("Booster Box", "Elite Trainer Box"…) doubles as the
    // little "what is this" label under the price.
    priceLabel: r.product_type ?? "sealed",
    pricesUpdatedAt: r.prices_updated_at
      ? r.prices_updated_at.slice(0, 10)
      : null,
  };
}

export class TcgCsvPriceSource implements PriceSource {
  readonly id = "tcgcsv";

  /**
   * Find sealed product whose name contains the typed words. We split the
   * query into words and require each (ILIKE '%word%') so "perfect box" still
   * finds "Perfect Order Booster Box". Returns [] on any trouble (empty index,
   * DB error) so the rest of the lookup keeps working.
   */
  async search(query: PriceQuery): Promise<PriceCandidate[]> {
    const words = query.name
      .split(/\s+/)
      // Strip characters that would break PostgREST's `.or()` filter syntax
      // (it uses commas to separate conditions and parens to group).
      .map((w) => w.trim().replace(/[(),]/g, ""))
      .filter(Boolean);
    if (words.length === 0) return [];

    try {
      const sb = readClient();
      let q = sb
        .from("sealed_products")
        .select("product_id,name,set_name,image_url,market_price,product_type,prices_updated_at")
        // Pull a wide net, highest-value first, then we re-rank by relevance in
        // JS below and trim to MAX_RESULTS. Price-first ordering here just means
        // that when a query has MORE than FETCH_LIMIT matches, we keep the
        // valuable ones (boxes/ETBs) rather than $1 packs.
        .order("market_price", { ascending: false })
        .limit(FETCH_LIMIT);
      // AND every typed word, each matching the product NAME or its SET name
      // (so "charizard paldean" finds a Paldean-Fates Charizard product even if
      // "paldean" is only in the set). Within a word it's name-OR-set; the
      // words AND together.
      for (const w of words) {
        q = q.or(`name.ilike.%${w}%,set_name.ilike.%${w}%`);
      }
      const { data, error } = await q;
      if (error) return [];
      const rows = (data ?? []) as SealedRow[];

      // Rank best-name-match first; for equal relevance, keep the price-desc
      // order from the DB (the array is already in that order, and the sort is
      // stable). Then trim to what the UI shows.
      const query = words.join(" ");
      return rows
        .map((r, i) => ({ r, i, score: relevanceScore(r.name, query, r.set_name ?? "") }))
        .sort((a, b) => b.score - a.score || a.i - b.i)
        .slice(0, MAX_RESULTS)
        .map((x) => rowToCandidate(x.r));
    } catch {
      // Table missing / Supabase down / no keys → just no sealed matches.
      return [];
    }
  }
}
