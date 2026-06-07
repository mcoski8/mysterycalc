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

const MAX_RESULTS = 12;

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
      .map((w) => w.trim())
      .filter(Boolean);
    if (words.length === 0) return [];

    try {
      const sb = readClient();
      let q = sb
        .from("sealed_products")
        .select("product_id,name,set_name,image_url,market_price,product_type,prices_updated_at")
        // Highest-value product first — a vendor pricing prizes usually wants
        // the box/ETB, not a $1 single pack, near the top.
        .order("market_price", { ascending: false })
        .limit(MAX_RESULTS);
      // AND every typed word as a case-insensitive substring of the name.
      for (const w of words) {
        q = q.ilike("name", `%${w}%`);
      }
      const { data, error } = await q;
      if (error) return [];
      return ((data ?? []) as SealedRow[]).map(rowToCandidate);
    } catch {
      // Table missing / Supabase down / no keys → just no sealed matches.
      return [];
    }
  }
}
