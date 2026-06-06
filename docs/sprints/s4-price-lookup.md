# Sprint 4 — Price Lookup

> **Phase:** 4 (Price data)
> **Status:** ✅ BUILT + owner-verified in the browser (2026-06-06). Card name → market value auto-fills.
> Exit criterion met. Sealed-product pricing via **tcgcsv** is ADOPTED but deferred to its own sprint
> (Decision 031).
> **Goal:** Let a vendor type a card name and have its market value filled in automatically, behind a
> pluggable price-source interface, with manual entry always available as the fallback.
> **Exit criterion:** Search a card → market value auto-fills.

---

## Scope for this sprint

- **In:** a pluggable `PriceSource` interface; a free **pokemontcg.io** implementation (singles, TCGPlayer
  market price); a server-side search route with caching + a rate guard; a `CardSearch` UI that adds a
  pre-filled prize row when the vendor picks a card. Manual entry untouched (the feature only *adds* rows).
- **Out (this sprint):** **sealed-product** auto-pricing (booster boxes / ETBs / packs). Confirmed available
  for free via **tcgcsv.com** (see Session Log) but needs its own build (a nightly sync/index — tcgcsv is a
  bulk catalog, not a search API). Logged as Decision 031, deferred to a dedicated sprint.
- **Permanently manual:** graded (PSA/BGS/CGC) — no free source anywhere (not in TCGPlayer's catalog).

## Design (as built)

- **Interface** `lib/prices/types.ts`: `PriceSource.search(query) → PriceCandidate[]`. The realized shape
  returns *candidate cards* (name, set, number, rarity, image, market value, price label) rather than the
  spec's single `getMarketValue → number`, because real card lookup is a disambiguation problem (Decision 029).
- **Pure extraction** `lib/prices/extract.ts`: `pickMarketValue(prices)` + `rawToCandidate(raw)` — the only
  rules-y logic (which printing variant, which price field), kept pure and unit-tested (`tests/prices.test.ts`).
  Prefers a standard printing over scarce 1st-edition; prefers the sold-derived `market` field, then mid/low.
- **Sources** `lib/prices/pokemontcg.ts` (the real one; builds a token-wildcard name query, fetches only the
  fields we use, sorts priced cards first) + `lib/prices/manual.ts` (always returns [] → type it in). Barrel +
  `getActivePriceSource()` in `lib/prices/index.ts` (reads the optional `POKEMONTCG_API_KEY` server-side).
- **Route** `app/api/prices/search/route.ts` (Node runtime): validates `q`, serves from a 24h in-memory cache,
  applies a per-process rate guard, calls the active source, and on any failure returns a friendly
  "enter values manually" message — never a crash. The browser never calls pokemontcg.io directly.
- **UI** `components/calculator/CardSearch.tsx` (Client): debounced search box, loading/error/empty states,
  result list with thumbnail + set/number + market price; clicking a card calls `onPick`. Wired in
  `Calculator.tsx` (`handleAddFromCard`) — adds a non-filler row pre-filled with name + market value; cost and
  quantity are left for the vendor (we never know what they paid).

## Task table

| # | Task | Status |
|---|------|--------|
| 1 | Sprint doc + SPRINT_INDEX status | ✅ Done |
| 2 | `PriceSource` interface + types (`lib/prices/types.ts`) | ✅ Done |
| 3 | Pure extraction (`lib/prices/extract.ts`) | ✅ Done |
| 4 | pokemontcg.io source + manual source + barrel | ✅ Done |
| 5 | Search API route (cache + rate guard + graceful error) | ✅ Done |
| 6 | `CardSearch` UI + wire into `Calculator` (`handleAddFromCard`) | ✅ Done |
| 7 | `tests/prices.test.ts` (variant/field selection, no-price → manual) | ✅ Done (8 tests) |
| 8 | `.env.example` — optional `POKEMONTCG_API_KEY` | ✅ Done |
| 9 | Pre-flight: typecheck / lint / tests / build | ✅ Done (typecheck ✅, lint ✅, 49/49 tests ✅, build ✅) |
| 10 | Owner browser check (search a card → row auto-fills) | ✅ Done (owner-verified) |
| 11 | Sealed pricing via tcgcsv — research + build | ⏭️ Deferred to its own sprint (Decision 031) |

## Acceptance checks

- [x] Typing a card name shows matching cards with set/number/rarity/thumbnail and a market price.
- [x] Clicking a result adds a new prize row pre-filled with the name and market value.
- [x] A card with no price shows "No price" → the vendor types it (manual fallback intact).
- [x] A lookup failure shows "enter values manually," never a broken page.
- [x] Manual entry of every field still works exactly as before.

## Session Log

### Session 5 — 2026-06-06 — Phase 4 / Sprint 4 BUILT (price lookup) + tcgcsv-sealed research

**Outcome.** Rolled the handoff (`MASTER_HANDOFF_01.md` closed "covers Sessions 1–4"; started `_02`). Built
Phase 4 price lookup end-to-end and the owner verified it in the browser: type a card name → pick a result →
a prize row appears pre-filled with the market value. Pre-flight all green: typecheck ✅, lint ✅, **49/49
tests ✅** (8 new), build ✅. Verified the live API path directly (real market values returned; cache hits;
too-short/no-match handled; priced cards sorted first).

**What was built (files).**
- `lib/prices/types.ts`, `lib/prices/extract.ts` (pure, tested), `lib/prices/pokemontcg.ts`,
  `lib/prices/manual.ts`, `lib/prices/index.ts`.
- `app/api/prices/search/route.ts` — server route, 24h in-memory cache, per-process rate guard, friendly errors.
- `components/calculator/CardSearch.tsx` — the search UI; wired into `components/calculator/Calculator.tsx`
  (`handleAddFromCard`, rendered above `PrizePoolEditor`).
- `tests/prices.test.ts` (8). `.env.example` — optional `POKEMONTCG_API_KEY`.

**Gotchas / landmines (hit + fixed this session).**
- **React 19 / Next 16 lint rule `react-hooks/set-state-in-effect`:** calling `setState` synchronously in an
  effect body errors. Fixed by deriving the idle state at render (`view`) instead of setting it in the effect.
- **Card image host varies and migrates.** The owner's browser hit a runtime error: newer cards' images come
  from `images.scrydex.com` (pokemontcg.io is now run by Scrydex), not `images.pokemontcg.io`. `next/image`
  requires every host be allow-listed, so it crashed. Fixed by using a plain `<img>` for these tiny external
  thumbnails (host-agnostic; one `eslint-disable` line with a FRAGILE note) and reverting the `next.config.ts`
  remote-image patterns. **Data-only tests didn't catch this — the owner's visual check did.**
- pokemontcg.io is **singles only** — no sealed, no graded. Sealed is free via tcgcsv (below); graded isn't free anywhere.

**tcgcsv research (the owner's lead — leads into the next sprint).**
- PokeHolder's second free source is **tcgcsv.com** (`https://tcgcsv.com/tcgplayer/3` = Pokémon; relays
  TCGPlayer's full catalog + per-SKU market prices; free, key-less, ~daily; wants a User-Agent).
- **Sealed product IS included with prices** — verified live against set "Perfect Order" (group 24587):
  123 singles + **31 sealed** products, e.g. Booster Box $222.34, Elite Trainer Box $76.31, Pokémon Center
  ETB $142.52, Booster Bundle $40.34, Booster Pack $5.91, Booster Box Case $1,288.96.
- PokeHolder ignores tcgcsv's sealed rows only because it's a singles-only binder tool (it joins on
  single-card product IDs in `lib/data/tcgplayer-products.json`). The sealed data is right there for us.
- **Catch:** tcgcsv is a bulk catalog (no search-by-name endpoint), so making sealed searchable needs a small
  nightly sync/index into our Supabase — exactly what PokeHolder's `scripts/sync-tcgcsv.mjs` does for singles.
- **Owner decision:** adopt tcgcsv-for-sealed but DEFER it to its own sprint (Decision 031). Mystery games use
  sealed prizes heavily (ETBs, boxes, packs), so this is high value — the next sprint.

**Decisions logged.** D-029 (realized search interface returns candidates), D-030 (host-agnostic `<img>` for
card thumbnails), D-031 (adopt tcgcsv as the free sealed-product price source; build in its own sprint).
