# MASTER_HANDOFF_02 — Sessions 5+

> Append-only session journal. Continues from `MASTER_HANDOFF_01.md` (which covered Sessions 1–4:
> Phases 0–3 complete and owner-verified). When this file passes ~15KB, close it with a summary header
> and start `MASTER_HANDOFF_03.md` (and point `CURRENT_PHASE.md` at the new file).

---

## Session 5 — 2026-06-06 — Phase 4 (Price Lookup) BUILT + tcgcsv-sealed research

**Accomplished.**
- **Rolled the handoff:** closed `MASTER_HANDOFF_01.md` ("covers Sessions 1–4"), started this file (`_02`).
- **Phase 4 — Price Lookup built end-to-end and owner-verified in the browser.** A vendor types a card name,
  sees matching cards (set, number, rarity, thumbnail, TCGPlayer market price), and clicks one to add a prize
  row pre-filled with the name + market value. Manual entry is untouched (the feature only *adds* rows).
  **Phase 4 exit criterion met.** Pre-flight all green: typecheck ✅, lint ✅, **49/49 tests ✅** (8 new), build ✅.
- **Researched the owner's lead (tcgcsv):** confirmed it carries sealed-product prices for free; adopted it
  for sealed but deferred the build to its own sprint (owner's call).

**Files added.**
- `lib/prices/types.ts` (interface + `PriceCandidate`), `lib/prices/extract.ts` (**pure**, tested:
  `pickMarketValue` + `rawToCandidate`), `lib/prices/pokemontcg.ts` (the real source),
  `lib/prices/manual.ts` (fallback), `lib/prices/index.ts` (barrel + `getActivePriceSource`).
- `app/api/prices/search/route.ts` — server route: 24h in-memory cache + per-process rate guard + friendly
  "enter manually" errors; the browser never calls the external API directly.
- `components/calculator/CardSearch.tsx` — the debounced search UI (loading/error/empty states, thumbnails).
- `tests/prices.test.ts` (8). `.env.example` — optional `POKEMONTCG_API_KEY`.

**Files changed.** `components/calculator/Calculator.tsx` (+`handleAddFromCard`, renders `CardSearch` above the
editor). `next.config.ts` (added then **reverted** an image host allow-list — see landmines).

**Decided (see DECISIONS_LOG.md).** D-029 (price-source interface returns candidate cards, not a single value),
D-030 (host-agnostic `<img>` for thumbnails), D-031 (adopt tcgcsv as the free sealed source; build it in its
own sprint).

**Open / next.**
1. **Sealed-product pricing via tcgcsv (the next sprint, D-031).** tcgcsv.com (`/tcgplayer/3` = Pokémon) has
   sealed boxes/ETBs/packs with live prices — verified (Perfect Order: Booster Box $222.34, ETB $76.31,
   Booster Pack $5.91, … 31 sealed in one set). But it's a **bulk catalog, not a search API**, so it needs a
   small **nightly sync/index into Supabase** (mirror PokeHolder's `scripts/sync-tcgcsv.mjs`, which uses a
   `User-Agent` and joins by TCGPlayer `productId`). Then extend `CardSearch` to surface sealed results, and
   add a `TcgCsvPriceSource` behind the existing `PriceSource` interface. Graded (PSA/BGS) stays manual — no
   free source. Per the owner's working style: **research the sync/index design (web + Gemini) and write a
   short plan BEFORE building.**
2. **Deferred from Phase 3:** the public no-login odds-sheet **share link** (share token + public-read path
   that still hides cost — do NOT relax RLS on `games`/`prize_items`).
3. **Phase 5 (Launch):** broad UI/UX polish + deploy to Vercel + domain + "not affiliated" footer.

**Landmines for next session.**
- **React 19 / Next 16 lint: `react-hooks/set-state-in-effect`** — never call `setState` synchronously in an
  effect body. Derive at render instead (see `CardSearch.tsx`'s `view`).
- **Card image hosts migrate** — `images.pokemontcg.io` (old) ↔ `images.scrydex.com` (new; pokemontcg.io is
  now run by Scrydex). We use a plain host-agnostic `<img>` (D-030). If you ever switch back to `next/image`,
  you must allow-list BOTH hosts (and watch for more).
- **The search route's cache + rate limit are in-memory only** (FRAGILE: reset on redeploy, not shared across
  serverless instances). Fine as a courtesy layer; if we deploy and need real limits, move to a shared store.
- **pokemontcg.io = singles only.** Don't expect sealed/graded from it — that's what tcgcsv (sealed) and a
  future paid source (graded) are for.
- **tcgcsv etiquette:** send an identifying `User-Agent` (their FAQ asks for it); it's a hobby host — be polite
  (PokeHolder uses concurrency 6 + chunked writes).

---

## Session 6 — 2026-06-06 — Sprint 4.5 (Sealed pricing via tcgcsv) BUILT + owner-verified

**Accomplished.**
- **Sealed-product pricing built end-to-end and owner-verified** ("works as intended"). A vendor searches a
  booster box / ETB / pack and it auto-fills a prize row with its TCGPlayer market value, alongside singles.
  **Sprint 4.5 / Phase 4 sealed exit criterion met.** Pre-flight all green: typecheck ✅, lint ✅, **57/57
  tests ✅** (8 new), build ✅. Migration applied to the remote DB; **1,848** priced sealed products indexed
  across all 217 Pokémon sets (full sync ≈ 4.6s).
- **Research-first (owner's rule):** probed tcgcsv live to settle sealed-detection, consulted Gemini 2.5 Pro
  (PAL) on the sync/table/merge architecture, wrote a plan, then built. The empirical probe *improved* on the
  consult — see D-032.

**Files added.** `supabase/migrations/20260606130000_sealed_products.sql`; `lib/sealed/classify.ts` (pure,
tested), `lib/sealed/db.ts` (cookie-free service/anon clients), `lib/sealed/sync.ts` (`syncSealed()`);
`scripts/sync-sealed.ts` (run via `npx tsx`); `app/api/cron/sync-sealed/route.ts`; `vercel.json` (daily cron);
`lib/prices/tcgcsv.ts` (`TcgCsvPriceSource`), `lib/prices/composite.ts` (`CompositePriceSource`);
`tests/sealed-classify.test.ts` (8).
**Files changed.** `lib/prices/types.ts` (+`kind`), `lib/prices/extract.ts` (`kind:"single"`),
`lib/prices/index.ts` (composite wiring); `components/calculator/CardSearch.tsx` (Sealed badge + meta line);
`components/calculator/Calculator.tsx` (`handleAddFromCard` sets sealed `type`); `.env.example`
(`CRON_SECRET`; service-role now in use); `package.json` (+`tsx` devDep).

**Decided (see DECISIONS_LOG.md).** D-032 — field-absence sealed detection (no `Number`/`Rarity`); one
full-sync path (4.6s, no discover/refresh split); `CompositePriceSource` (sealed first). Rejected Gemini's
keyword AND-filter (it drops keyword-less sealed product like "Collector Chest").

**Open / next.**
1. **Phase 5 (Launch)** is the remaining phase: UI/UX polish, deploy to Vercel, custom domain, "not affiliated"
   footer. **At deploy time**, finish the sealed cron by setting `CRON_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` in
   the Vercel project's env vars (the code + `vercel.json` are already in place). Until deployed, the cron is
   dormant; the local `npx tsx scripts/sync-sealed.ts` refreshes the index on demand.
2. **Deferred from Phase 3:** public no-login odds-sheet **share link** (share token + public-read path that
   still hides cost — do NOT relax RLS on `games`/`prize_items`).
3. **Permanently manual:** graded (PSA/BGS/CGC) — no free price source.

**Landmines for next session.**
- **Sealed detection = field-absence, NOT keywords (D-032).** A product is sealed iff its `extendedData` has no
  `Number` AND no `Rarity`. Do NOT add a name-keyword AND-filter — it drops real sealed product that lacks an
  obvious keyword. Keywords only set the cosmetic `product_type` label.
- **`tsx` is the sealed-sync runner:** `npx tsx scripts/sync-sealed.ts` (`--dry` to preview, `GROUPS=ID` to
  scope). `lib/sealed/*` use **relative** imports (not `@/`) so tsx resolves them without tsconfig-path setup.
- **Never partial-column-upsert `sealed_products`** — NOT-NULL columns (`name`, `group_id`) reject it. Always
  upsert full rows (this is why there's a single full-sync path).
- **Sealed cron is dormant until Phase 5 deploy** — needs the app live on Vercel + `CRON_SECRET` +
  service-role key in the Vercel dashboard. `/api/cron/sync-sealed` refuses to run with no `CRON_SECRET` set.
- **`sealed_products` is public reference data** — RLS `select using(true)`, no write policy (service-role
  only). No user data, no cost/profit — safe to expose to anon reads.
- **Search ordering is sealed-first by value** — broad terms ("charizard") show sealed collections above
  single cards. Owner accepted this. Tune later only if it annoys.
