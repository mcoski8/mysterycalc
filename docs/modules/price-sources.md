# Module — Price Sources (manual now, lookup later)

> **Location (planned):** `lib/prices/` (the interface) + a manual implementation now; an API implementation
> in Phase 4.
> **Status:** Spec only. Manual entry is the v1 reality (Decision 006); the interface exists so automatic
> lookup drops in later without a rewrite.
> **Related:** PokeHolder's `price-engine` / `data-sources` docs (reuse those learnings).

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
