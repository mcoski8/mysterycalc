// ============================================================
// GET /api/prices/search?q=<card name> — the price-lookup endpoint.
//
// Plain English: the card-search box in the browser calls this. It takes the
// typed name, asks the active price source (pokemontcg.io) for matches, and
// returns a small JSON list of cards with their market values. It runs on the
// server so any API key stays private and we can cache + rate-limit in one
// place. The browser never talks to pokemontcg.io directly.
//
// Two guards live here so we stay a polite, free app:
//  - a short-lived in-memory CACHE, so repeating a search costs nothing; and
//  - a simple per-process RATE LIMIT, so a runaway client can't hammer the
//    upstream API.
// Both are best-effort and in-memory only (see FRAGILE note) — combined with
// the client's typing debounce, they keep us well under the free quota.
// ============================================================

import { NextResponse } from "next/server";
import { getActivePriceSource, type PriceCandidate } from "@/lib/prices";

// Run on the Node.js runtime: module-level state (the cache/limiter Maps)
// must survive between requests on the same server instance.
export const runtime = "nodejs";

const MIN_QUERY_LEN = 2; // ignore 1-character noise.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // prices refresh daily.
const CACHE_MAX_ENTRIES = 200; // bound memory; evict oldest when full.

// Rate limit: at most RATE_MAX upstream-eligible requests per RATE_WINDOW_MS,
// per server instance. Cache hits don't count. Generous for real use; only a
// stuck loop would ever hit it.
const RATE_WINDOW_MS = 10_000;
const RATE_MAX = 30;

// FRAGILE: in-memory only. Resets on redeploy/cold start and is NOT shared
// across serverless instances — that's fine, it's a courtesy cache, not a
// correctness guarantee.
type CacheEntry = { expires: number; candidates: PriceCandidate[] };
const cache = new Map<string, CacheEntry>();
let recentHits: number[] = []; // timestamps of recent upstream calls.

/** Normalize a query so "Charizard ", "charizard" share one cache slot. */
function cacheKey(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/** True if we've made too many upstream calls in the recent window. */
function rateLimited(now: number): boolean {
  recentHits = recentHits.filter((t) => now - t < RATE_WINDOW_MS);
  return recentHits.length >= RATE_MAX;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  // Too short to be a real search → empty list, no upstream call.
  if (q.length < MIN_QUERY_LEN) {
    return NextResponse.json({ candidates: [] });
  }

  const key = cacheKey(q);
  const now = Date.now();

  // 1) Serve from cache if we have a fresh answer.
  const cached = cache.get(key);
  if (cached && cached.expires > now) {
    return NextResponse.json({ candidates: cached.candidates, cached: true });
  }

  // 2) Respect the rate limit before reaching out.
  if (rateLimited(now)) {
    return NextResponse.json(
      { candidates: [], error: "Too many lookups at once — please wait a moment and try again." },
      { status: 429 },
    );
  }

  // 3) Ask the active source. A failure here is "lookup unavailable," not a
  //    crash — the UI keeps letting the vendor type values by hand.
  try {
    recentHits.push(now);
    const source = getActivePriceSource();
    const candidates = await source.search({ name: q });

    // Store the fresh result, evicting the oldest entry if we're full.
    if (cache.size >= CACHE_MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, { expires: now + CACHE_TTL_MS, candidates });

    return NextResponse.json({ candidates });
  } catch {
    return NextResponse.json(
      {
        candidates: [],
        error: "Price lookup is unavailable right now — you can still enter values manually.",
      },
      { status: 502 },
    );
  }
}
