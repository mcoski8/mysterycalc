# Current: Phase 4 / Sprint 4 (Price Lookup) — ✅ BUILT + owner-verified. **Next: sealed pricing via tcgcsv (S4.5).**

> Updated: 2026-06-06 (end of Session 5)
> Status: **Phases 1–4 are DONE and owner-verified.** Phase 4 (Price Lookup) shipped this session: a vendor
> types a card name and an automatic **TCGPlayer market value** fills into a new prize row; manual entry stays
> the always-available fallback. Built on a **pluggable price-source interface** (pokemontcg.io for singles
> today; sealed/graded handled deliberately later). **Sealed-product pricing via tcgcsv is adopted but
> deferred to its own sprint (S4.5, Decision 031).**
> Active handoff: **`docs/handoff/MASTER_HANDOFF_02.md`** (Session 5 appended; `_01` closed, covers Sessions 1–4).
> Anchoring docs: `docs/CLAUDE.md` (master context), `docs/sprints/s4-price-lookup.md` (this sprint),
> `docs/modules/price-sources.md` (now implemented), `docs/DECISIONS_LOG.md` (001–031).

---

## What MysteryCalc is (one paragraph)

A free web app for **vendors** to **design and price mystery games** (oripa, mystery boxes, walls of sleeves,
prize wheels, kuji, razzes — the finite-pool family). Enter prizes (market value AND your cost), pick a game
type, set any two of {buy-in price, number of chances, target margin}, and it solves the third — then shows
profit three ways, hit rate, prize-tier breakdown, and break-even. **Log in to save your games, print a
customer-facing odds sheet, and look up a card's market value by name.** Stack: Next.js 16 + Supabase + Vercel.

## What was completed (Session 5 — Sprint 4)

- **Rolled the handoff:** `MASTER_HANDOFF_01.md` closed ("covers Sessions 1–4"); started `MASTER_HANDOFF_02.md`.
- **Phase 4 — Price Lookup built + owner-verified in the browser:**
  - Pluggable `PriceSource` interface (`lib/prices/types.ts`, Decision 029 — `search → PriceCandidate[]`).
  - Free **pokemontcg.io** source (singles, TCGPlayer market price) + a **manual** fallback source; pure,
    unit-tested picking logic in `lib/prices/extract.ts`.
  - Server route `app/api/prices/search` (24h in-memory cache + per-process rate guard + graceful errors).
  - `CardSearch.tsx` UI wired into `Calculator` — picking a card adds a prize row pre-filled with the market value.
  - `tests/prices.test.ts` (8). Pre-flight all green: typecheck ✅, lint ✅, **49/49 tests ✅**, build ✅.
- **tcgcsv research (the owner's lead):** confirmed tcgcsv.com carries **sealed-product** prices for free;
  adopted it (Decision 031) but deferred the build to its own sprint.
- **Decisions 029–031 logged.**

## In progress

- Nothing actively coding. Sprint 4 build is closed.

## Not started yet

- **Sprint 4.5 — Sealed-product pricing via tcgcsv** (Decision 031). The next sprint.
- **Deferred (Phase 3+):** public no-login share link for the odds sheet.
- **Phase 5 (Launch):** broad UI/UX polish + deploy to Vercel + domain + "not affiliated" footer.

## Blockers / open items

- **None blocking.** App runs with `npm run dev`; price lookup works against the live free API with no key.
- Soft: a free `POKEMONTCG_API_KEY` (from dev.pokemontcg.io) would raise rate limits — optional, not needed now.

## Gotchas / lessons

- **React 19 / Next 16 lint `react-hooks/set-state-in-effect`:** never call `setState` synchronously in an
  effect body — derive the value at render instead (see `CardSearch.tsx`'s `view`).
- **Card image hosts migrate:** `images.pokemontcg.io` (old) ↔ `images.scrydex.com` (new; pokemontcg.io is run
  by Scrydex). We use a host-agnostic plain `<img>` (Decision 030); `next/image` would require allow-listing
  every host. **The owner's visual check caught this — data-only tests couldn't.**
- **The search route's cache + rate limit are in-memory only** (reset on redeploy, not shared across serverless
  instances) — a courtesy layer, fine for now; revisit if real limits are needed in production.
- **pokemontcg.io = singles only.** Sealed → tcgcsv (next sprint); graded (PSA/BGS) → no free source, stays manual.
- **tcgcsv etiquette:** it's a bulk catalog (no name search) and a hobby host — send a `User-Agent`, be polite
  (PokeHolder uses concurrency 6); a future sealed feature needs a nightly sync/index into Supabase.

## Immediate next actions

1. **Sprint 4.5 — sealed pricing via tcgcsv (Decision 031):** first **research the sync/index design** (web +
   Gemini) and write a short plan (per the owner's "research before arch changes" rule), then build a nightly
   sync of sealed products + prices into Supabase, a `TcgCsvPriceSource` behind the existing interface, and
   surface sealed results in `CardSearch`. Template: PokeHolder's `scripts/sync-tcgcsv.mjs`.
2. **Stay in-phase** — the public odds-sheet share link (Phase 3+) and broad UI/UX polish (Phase 5) are not
   Sprint 4.5 work.

## Resume prompt for next session

```
MysteryCalc — Phases 1–4 are DONE and owner-verified. Phase 1 (calculator engine + UI), Phase 2 (Supabase
auth + save/reuse, RLS), Phase 3 (Customer Odds Sheet — print/PDF), and Phase 4 (Price Lookup — type a card
name → TCGPlayer market value auto-fills) are all built and owner-verified. All pre-flight passes (typecheck /
lint / 49 tests / build). NEXT UP: Sprint 4.5 — Sealed-product pricing via tcgcsv (Decision 031).

WHAT MYSTERYCALC IS: a free Next.js web app for VENDORS to design & price mystery games (oripa, mystery boxes,
walls of sleeves, prize wheels, kuji, razz — the finite-pool family). Enter prizes (market value AND cost) →
pick a game type → set any two of {buy-in P, # chances N, target margin m} → solve the third → see profit
three ways, hit rate, prize-tier breakdown, break-even. Log in to SAVE games, PRINT a customer odds sheet, and
LOOK UP a card's market value by name. Stack: Next.js 16 + TS + Tailwind v4 + shadcn + Supabase + Vercel.

THIS SESSION = SPRINT 4.5: SEALED-PRODUCT PRICING via tcgcsv (Decision 031). pokemontcg.io (our Phase 4
source) is singles only. tcgcsv.com relays TCGPlayer's FULL catalog for free (key-less, ~daily, wants a
User-Agent): https://tcgcsv.com/tcgplayer/3 = Pokémon, with /groups, /{group}/products, /{group}/prices.
SEALED IS CONFIRMED PRESENT WITH PRICES (set "Perfect Order": Booster Box $222.34, ETB $76.31, PC ETB $142.52,
Booster Pack $5.91, … 31 sealed products). CATCH: tcgcsv is a BULK CATALOG, not a search API — so sealed needs
a nightly SYNC/INDEX into Supabase before it's searchable. Per the owner's rule, RESEARCH the sync/index design
(web + Gemini via PAL/zen MCP) and write a short plan BEFORE building. Template: PokeHolder's
scripts/sync-tcgcsv.mjs (/Users/michaelchang/CODE/pokeholder/) — it uses a User-Agent, concurrency 6, joins by
TCGPlayer productId. Then: a TcgCsvPriceSource behind the existing PriceSource interface + sealed results in
CardSearch. Graded (PSA/BGS) stays manual — no free source.

PHASE 4 KEY CODE (shipped): pluggable interface lib/prices/types.ts (PriceSource.search → PriceCandidate[]),
pure tested picker lib/prices/extract.ts, sources lib/prices/{pokemontcg,manual}.ts + barrel index.ts
(getActivePriceSource reads optional POKEMONTCG_API_KEY server-side), route app/api/prices/search/route.ts
(24h in-memory cache + per-process rate guard + graceful errors), UI components/calculator/CardSearch.tsx wired
into Calculator.tsx (handleAddFromCard). tests/prices.test.ts (8). PHASES 1–3 CODE: see MASTER_HANDOFF_01.md.

SUPABASE: project ref txrlpwvmawwfuuzedfbw (https://txrlpwvmawwfuuzedfbw.supabase.co). Keys in gitignored
.env.local. CLI linked; `supabase db push` applies migrations. A sealed-products table + nightly sync are the
S4.5 infra (we have no cron yet — design it; Vercel Cron is the likely host, like PokeHolder).

GOTCHAS: React 19/Next 16 lint react-hooks/set-state-in-effect — never setState synchronously in an effect body
(derive at render; see CardSearch's `view`). Card image hosts migrate (images.pokemontcg.io ↔
images.scrydex.com) — use a host-agnostic <img>, not next/image (Decision 030). The search route's cache +
rate limit are IN-MEMORY only (reset on redeploy, not shared across instances). Don't construct JSX inside a
try/catch in a Server Component. Next 16: middleware→proxy (proxy.ts, Node runtime); dynamic route params is a
Promise (await). NEVER trust the proxy for authz — server actions re-check the user + RLS is the boundary. Stay
on Vitest 3 (Decision 020). Secrets only in .env.local; never commit or expose the service-role key.

READ AT SESSION OPEN: docs/CLAUDE.md, docs/CURRENT_PHASE.md, docs/sprints/SPRINT_INDEX.md, the active sprint
file (docs/sprints/s4-price-lookup.md → then create s4.5), docs/modules/price-sources.md, and DECISIONS_LOG.md
(001–031). Follow AGENTS.md (comment standard for technical + semi-non-technical readers; append-only docs;
stay in-phase; Next.js is newer than training — check node_modules/next/dist/docs/).

AT SESSION CLOSE: follow docs/session-end-prompt.md line by line; update the sprint file + checklist +
SPRINT_INDEX; append DECISIONS + handoff; rewrite this file; commit + push to origin/main (Decision 019,
pre-authorized); end with the verbatim resume prompt.
```

---

*This file is REWRITTEN (not appended) at the end of every session.*
