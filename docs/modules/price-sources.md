# Module — Price Sources (manual fallback + automatic lookup)

> **Location:** `lib/prices/` (interface + sources), `app/api/prices/search/route.ts` (the endpoint),
> `components/calculator/CardSearch.tsx` (the UI).
> **Status:** ✅ **BUILT (Phase 4 / Sprint 4, 2026-06-06).** Automatic singles lookup via pokemontcg.io is
> live and owner-verified; manual entry remains the always-available fallback. **Sealed-product pricing via
> tcgcsv is now BUILT too (Sprint 4.5, Decisions 031–032)** — see that section below. Graded stays manual.
> **Related:** PokeHolder's `price-engine` / `data-sources` docs (reuse those learnings — incl. its
> `scripts/sync-tcgcsv.mjs`, the template for our future sealed sync).

---

## As built (Phase 4)

- **Interface (realized, Decision 029):** `PriceSource.search(query) → PriceCandidate[]` — returns *candidate
  cards* to pick from, not a single number, because card lookup is a disambiguation problem. `lib/prices/types.ts`.
- **Sources:** `PokemonTcgPriceSource` (free pokemontcg.io, singles + TCGPlayer market price) and
  `ManualPriceSource` (returns `[]` → type it in). `getActivePriceSource()` picks the live one and reads the
  optional `POKEMONTCG_API_KEY` server-side.
- **Pure picking logic** (`lib/prices/extract.ts`, unit-tested): prefer a standard printing over scarce
  1st-edition; prefer the sold-derived `market` field, then mid/low.
- **Endpoint** `GET /api/prices/search?q=` — 24h in-memory cache + per-process rate guard + graceful "enter
  manually" on any failure; the browser never calls the external API directly.
- **UI** `CardSearch.tsx` — debounced search; picking a card adds a prize row pre-filled with name + market
  value (cost/quantity left to the vendor). Thumbnails use a host-agnostic `<img>` (Decision 030 — the image
  CDN migrates between `images.pokemontcg.io` and `images.scrydex.com`).

## Sealed-product pricing via tcgcsv (✅ BUILT — Sprint 4.5, Decisions 031–032)

- **tcgcsv.com relays TCGPlayer's full catalog for free** (`https://tcgcsv.com/tcgplayer/3` = Pokémon;
  `/groups`, `/{group}/products`, `/{group}/prices`). Key-less, ~daily refresh, asks for a `User-Agent`.
- **It's a bulk catalog, not a search API**, so a sync copies just the sealed rows + prices into a Supabase
  table (`sealed_products`), and the app searches THAT. **1,848 priced sealed products across 217 sets**
  indexed (full sync ≈ 4.6s).
- **Sealed detection (Decision 032):** a product is sealed iff its `extendedData` has **no `Number` and no
  `Rarity`** (singles carry `Number`; code cards carry `Rarity`). Empirically zero false positives 1999→2026.
  `lib/sealed/classify.ts` (pure, tested). Keywords only derive the cosmetic `product_type` label.
- **Sync:** `lib/sealed/sync.ts` `syncSealed()` (UA + concurrency 6, full-row upserts). Two entry points share
  it: `scripts/sync-sealed.ts` (`npx tsx`, initial populate / on-demand) and `app/api/cron/sync-sealed`
  (nightly Vercel Cron, `CRON_SECRET`-protected, `maxDuration=60`; scheduled in `vercel.json`). Writes use the
  service role (`lib/sealed/db.ts#adminClient`); reads use anon (`readClient`). **The cron activates only after
  the Phase 5 Vercel deploy** (needs `CRON_SECRET` + service-role key in the Vercel dashboard); until then the
  local script keeps the index fresh.
- **Read path:** `lib/prices/tcgcsv.ts` `TcgCsvPriceSource.search` (ILIKE the table, `kind:"sealed"`) +
  `lib/prices/composite.ts` `CompositePriceSource([tcgcsv, pokemontcg])` (parallel, sealed first).
  `getActivePriceSource()` returns the composite; the `/api/prices/search` route is unchanged. `CardSearch`
  shows a "Sealed" badge + type label; picking one sets the prize `type` to `sealed`.
- **Graded (PSA/BGS/CGC) stays manual** — not in TCGPlayer's catalog, so no free source exists.

---

## What this module does (plain English)

It's the single, swappable place the app gets a prize's **market value** from. In v1 that "source" is just the
vendor typing the number in. Later, the same slot can be filled by an automatic price lookup (search a card →
value fills in) **without changing anything else in the app**, because everything talks to the *interface*,
not to a specific source.

## Why an interface now, before we need lookup

If the app called a pricing API directly all over the place, swapping or adding sources later would mean
touching the whole app. Instead, everything asks a small interface ("give me the market value for this item"),
and we provide different implementations behind it. Manual today, API tomorrow — same wiring.

## The interface (illustrative)

```ts
// A price source answers "what's the market value of this thing?"
interface PriceSource {
  readonly id: string                 // 'manual' | 'tcgplayer' | ...
  // Returns a per-unit market value, or null if it can't answer
  // (e.g. manual source always returns null → the user types it).
  getMarketValue(query: PriceQuery): Promise<number | null>
}

type PriceQuery = {
  name: string
  setName?: string
  cardNumber?: string
  // room to grow: variant (holo/reverse), grade (PSA10), etc.
}
```

## v1 implementation: `ManualPriceSource`

- Returns `null` for every query — the UI then shows an input for the vendor to type the value.
- This keeps the calculator fully usable on day one with zero external dependencies.

## Phase 4 implementation: automatic lookup

- Implement `PriceSource` against **pokemontcg.io / TCGPlayer** (TCGPlayer "Market Price" is the sold-derived
  value, exposed free via pokemontcg.io — see the PokeHolder data-sources notes).
- Concerns to handle then (NOT now): card-name matching, variant/grade selection, rate limits, caching,
  graceful fallback to manual when a lookup misses.
- GOTCHA: graded (PSA/BGS/CGC) and sealed-product prices have no clean free source — those likely stay manual
  even after lookup ships. Don't promise auto-pricing for slabs/sealed.

## Rules

- Nothing outside this module should know *which* price source is active — they all go through the interface.
- Manual entry must always remain available as a fallback, even after lookup exists.
- No paid pricing dependency without a logged decision (consistent with the project's cost discipline).
- Comment for technical + semi-non-technical readers per `docs/CLAUDE.md`.
