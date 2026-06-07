// ============================================================
// CompositePriceSource — search several price sources at once.
//
// Plain English: a vendor's prizes are a mix of single cards AND sealed product
// (booster boxes, ETBs, packs). Singles come from pokemontcg.io; sealed comes
// from our tcgcsv index. This wrapper lets the app ask BOTH with one call: it
// runs each source in parallel and stitches the results into one list.
//
// Order matters: results are merged BEST-MATCH-FIRST across all sources, so an
// exact single-card match isn't buried under loosely-matching sealed bundles.
// When two results match the query equally well, the earlier source wins the
// tie — and sealed is listed first because mystery-game prizes are heavily
// sealed (ETBs, boxes, packs), so on a tie a vendor sees those on top.
//
// Robustness: if one source fails, we keep the others' results (a sealed-index
// hiccup shouldn't kill the singles lookup, and vice-versa). A source that
// throws contributes nothing rather than breaking the whole search.
// ============================================================

import type { PriceCandidate, PriceQuery, PriceSource } from "@/lib/prices/types";
import { relevanceScore } from "@/lib/prices/relevance";

export class CompositePriceSource implements PriceSource {
  readonly id = "composite";

  /** The sources to search, in display order (first = shown first). */
  private readonly sources: PriceSource[];

  constructor(sources: PriceSource[]) {
    this.sources = sources;
  }

  /**
   * Search every source in parallel, then merge BEST-MATCH-FIRST across them.
   * Each result is scored against the query; ties fall back to source order
   * (so sealed leads singles on an equal match) and then to each source's own
   * order (which already put its best/priced results first). One source
   * throwing just means it contributes no candidates.
   */
  async search(query: PriceQuery): Promise<PriceCandidate[]> {
    const settled = await Promise.allSettled(
      this.sources.map((s) => s.search(query)),
    );

    // Collect each candidate with its source index and within-source position,
    // so we can sort by relevance while keeping both as stable tiebreakers.
    const scored: {
      candidate: PriceCandidate;
      score: number;
      sourceIndex: number;
      pos: number;
    }[] = [];
    settled.forEach((result, sourceIndex) => {
      if (result.status !== "fulfilled") return;
      result.value.forEach((candidate, pos) => {
        scored.push({
          candidate,
          score: relevanceScore(candidate.name, query.name),
          sourceIndex,
          pos,
        });
      });
    });

    return scored
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.sourceIndex - b.sourceIndex ||
          a.pos - b.pos,
      )
      .map((x) => x.candidate);
  }
}
