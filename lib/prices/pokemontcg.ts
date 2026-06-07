// ============================================================
// PokemonTcgPriceSource — looks cards up on the free pokemontcg.io API.
//
// Plain English: this is the real price provider. Give it a card name and it
// asks pokemontcg.io for matching cards, then hands back a clean list with
// each card's TCGPlayer market value (the actual going rate). It runs
// SERVER-SIDE only (called from the /api/prices/search route), so any API
// key stays off the browser and we can cache/limit centrally.
//
// Why pokemontcg.io: it's free, needs no key for light use, and exposes
// TCGPlayer "market" prices — exactly Decision 006's plan, no paid
// dependency. The messy job of picking one price per card lives in the pure
// `extract.ts` (so it's unit-tested without the network).
//
// FRAGILE: this depends on an external API's shape and uptime. The route
// that calls it must treat a thrown error as "lookup unavailable, type it in
// manually," never as a crash.
// ============================================================

import type { PriceCandidate, PriceQuery, PriceSource } from "@/lib/prices/types";
import { rawToCandidate, type RawCard } from "@/lib/prices/extract";
import { relevanceScore } from "@/lib/prices/relevance";

const API_URL = "https://api.pokemontcg.io/v2/cards";
// Fetch a generous page so the vendor can scroll through real choices (printings,
// art variants) — not just a handful. Still bounded to keep payloads sane.
const MAX_PAGE_SIZE = 40;

// Lucene-ish special characters the API's query language treats specially.
// We strip them from user input so a stray quote/colon can't break the query
// (or be used to inject query syntax).
const SPECIAL_CHARS = /[+\-&|!(){}[\]^"~*?:\\/]/g;

/**
 * Build the API query string from the typed name. We split into words and
 * wildcard-match each (`name:*char* name:*ex*`) so partial, multi-word names
 * ("char ex") still match — the API ANDs the terms. Returns "" if nothing
 * usable is left after cleaning (the source then returns no results).
 */
function buildNameQuery(name: string): string {
  const tokens = name
    .replace(SPECIAL_CHARS, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return "";
  return tokens.map((t) => `name:*${t}*`).join(" ");
}

export class PokemonTcgPriceSource implements PriceSource {
  readonly id = "pokemontcg";

  /** Optional API key (raises rate limits). Read server-side only. */
  private readonly apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search pokemontcg.io for the typed name and return clean candidates,
   * newest sets first (most relevant to current product). Throws if the API
   * call itself fails so the route can show a friendly "try manual" message.
   */
  async search(query: PriceQuery): Promise<PriceCandidate[]> {
    const q = buildNameQuery(query.name);
    if (!q) return [];

    const pageSize = Math.min(query.pageSize ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const url = new URL(API_URL);
    url.searchParams.set("q", q);
    url.searchParams.set("pageSize", String(pageSize));
    // Newest releases first — a vendor pricing today's prizes usually wants
    // current cards; the set + number shown lets them pick older printings.
    url.searchParams.set("orderBy", "-set.releaseDate");
    // Only fetch the fields we use — smaller, faster responses.
    url.searchParams.set("select", "id,name,number,rarity,set,images,tcgplayer");

    const headers: Record<string, string> = {};
    if (this.apiKey) headers["X-Api-Key"] = this.apiKey;

    const res = await fetch(url, {
      headers,
      // Cache at the fetch layer for a day too — prices refresh daily, and
      // this shields the API from repeat identical lookups across requests.
      next: { revalidate: 86_400 },
    });

    if (!res.ok) {
      throw new Error(`pokemontcg.io responded ${res.status}`);
    }

    const body = (await res.json()) as { data?: RawCard[] };
    const cards = Array.isArray(body.data) ? body.data : [];
    const candidates = cards.map(rawToCandidate);

    // Rank results so the BEST match for what was typed is on top. Two signals,
    // in order: (1) how well the card name matches the query (an exact
    // "Charizard ex" beats a long bundle that merely contains the words), then
    // (2) cards that actually HAVE a price first, since auto-filling a value is
    // the whole point. The API's newest-set-first order survives as the final
    // tiebreak because `sort` is stable.
    return candidates
      .map((c, i) => ({ c, i, score: relevanceScore(c.name, query.name) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const aHas = a.c.marketValue !== null ? 0 : 1;
        const bHas = b.c.marketValue !== null ? 0 : 1;
        if (aHas !== bHas) return aHas - bHas;
        return a.i - b.i;
      })
      .map((x) => x.c);
  }
}
