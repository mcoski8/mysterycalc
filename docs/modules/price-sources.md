# Module — Price Sources (manual fallback + automatic lookup)

> **Location:** `lib/prices/` (interface + sources), `app/api/prices/search/route.ts` (the endpoint),
> `components/calculator/CardSearch.tsx` (the UI).
> **Status:** ✅ **BUILT (Phase 4 / Sprint 4, 2026-06-06).** Automatic singles lookup via pokemontcg.io is
> live and owner-verified; manual entry remains the always-available fallback. Sealed-product pricing via
> **tcgcsv** is adopted but deferred to its own sprint (Decision 031). Graded stays manual (no free source).
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

## Sealed-product pricing via tcgcsv (adopted, next sprint — Decision 031)

- **tcgcsv.com relays TCGPlayer's full catalog for free** (`https://tcgcsv.com/tcgplayer/3` = Pokémon;
  `/groups`, `/{group}/products`, `/{group}/prices`). Key-less, ~daily refresh, asks for a `User-Agent`.
- **Sealed IS included with prices** — verified live (set "Perfect Order": Booster Box $222.34, Elite Trainer
  Box $76.31, Pokémon Center ETB $142.52, Booster Bundle $40.34, Booster Pack $5.91, … 31 sealed products).
- **Catch:** it's a *bulk catalog, not a search API* → needs a small **nightly sync/index into Supabase**
  before sealed can be searched (mirror PokeHolder's `scripts/sync-tcgcsv.mjs`). Then add a `TcgCsvPriceSource`
  behind the existing interface and surface sealed results in `CardSearch`.
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
