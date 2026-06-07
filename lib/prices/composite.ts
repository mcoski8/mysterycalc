// ============================================================
// CompositePriceSource — search several price sources at once.
//
// Plain English: a vendor's prizes are a mix of single cards AND sealed product
// (booster boxes, ETBs, packs). Singles come from pokemontcg.io; sealed comes
// from our tcgcsv index. This wrapper lets the app ask BOTH with one call: it
// runs each source in parallel and stitches the results into one list.
//
// Order matters: sources earlier in the list appear earlier in the results. We
// put sealed first because mystery-game prizes are heavily sealed (ETBs, boxes,
// packs) — so a vendor sees those near the top.
//
// Robustness: if one source fails, we keep the others' results (a sealed-index
// hiccup shouldn't kill the singles lookup, and vice-versa). A source that
// throws contributes nothing rather than breaking the whole search.
// ============================================================

import type { PriceCandidate, PriceQuery, PriceSource } from "@/lib/prices/types";

export class CompositePriceSource implements PriceSource {
  readonly id = "composite";

  /** The sources to search, in display order (first = shown first). */
  private readonly sources: PriceSource[];

  constructor(sources: PriceSource[]) {
    this.sources = sources;
  }

  /**
   * Search every source in parallel; concatenate their results in source
   * order. One source throwing just means it contributes no candidates.
   */
  async search(query: PriceQuery): Promise<PriceCandidate[]> {
    const settled = await Promise.allSettled(
      this.sources.map((s) => s.search(query)),
    );
    const out: PriceCandidate[] = [];
    for (const result of settled) {
      if (result.status === "fulfilled") out.push(...result.value);
    }
    return out;
  }
}
