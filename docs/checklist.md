# Development Checklist — MysteryCalc

> **Purpose:** Track all tasks by phase and sprint. Check off `[x]` as completed. `~~struck~~` = decided
> NOT to do (with a note). Append new tasks as phases are planned.

---

## Phase 0 — Planning & Documentation

### Sprint 0: Foundation (docs + scope)
- [x] Create the `mysterycalc/` repo folder
- [x] Research: JP vs US mystery games → `docs/research/japanese-vs-american-mystery-games.md` (Gemini-converged)
- [x] Lock product definition with the owner (audience, scope, platform, money model, outputs, tone)
- [x] Validate the economic model with Gemini (V/N/P/margin, Σqty=N rule, market-vs-cost, game-feel outputs)
- [x] Write `PROCESS.md` (the documentation-system explainer)
- [x] Write `docs/PROPOSAL.md` (the sign-off gate)
- [x] Write root `CLAUDE.md` (pointer) + `AGENTS.md` (agent rules + comment standard)
- [x] Write `docs/CLAUDE.md` (master context)
- [x] Write `docs/DECISIONS_LOG.md` (Decisions 001–013)
- [x] Write `docs/CURRENT_PHASE.md`
- [x] Write `docs/checklist.md` (this file)
- [x] Write `docs/session-end-prompt.md`
- [x] Write `docs/sprints/SPRINT_INDEX.md`, `s0-foundation.md`, `s1-core-calculator.md`
- [x] Write `docs/handoff/MASTER_HANDOFF_01.md`
- [x] Write module docs: calculation-engine, prize-pool, game-types, odds-sheet, price-sources, database-schema
- [x] Write `README.md` + `.gitignore`
- [x] `git init` + initial commit
- [x] **Owner sign-off on `docs/PROPOSAL.md`** (5 open items resolved) ← PHASE 0 EXIT GATE ✅ 2026-06-05
- [x] Log sign-off resolutions as Decisions 014–018

**Phase 0 COMPLETE (2026-06-05).** Phase 1 cleared to begin.

---

## Phase 1 — Core Calculator (MVP)  *(✅ Sprint 1 COMPLETE — 2026-06-05)*

### Sprint 1: Core Calculator
**Scaffold**
- [x] Scaffold Next.js (App Router) + TypeScript project (Next 16.2.7 — read bundled v16 docs first)
- [x] Set up Tailwind + shadcn/ui (Tailwind v4, shadcn Nova/radix)
- [x] Configure ESLint + typecheck + a test runner (Vitest 3), and `npm` scripts

**The calculation engine (pure TS in `lib/` — build and test BEFORE any UI)**
- [x] Types: prize item (name, type, market value, cost, quantity, isFiller), game config, results → `lib/types.ts`
- [x] Pool value `V` = Σ(market value × quantity); pool cost = Σ(cost × quantity) → `lib/pool/pool.ts`
- [x] Solve-for: `N` from (V,P,m); `P` from (V,N,m); `m` from (V,N,P) → `lib/engine/engine.ts`
- [x] Filler auto-balance so Σ(quantities) = N for every-chance-wins games → `balanceFiller`
- [x] Razz special case (1 prize, N chances)
- [x] Cut three ways: margin %, profit $ (uses cost), pool multiple
- [x] Game-feel outputs: hit rate (% chances ≥ buy-in), prize-tier buckets, volatility
- [x] Break-even / sell-through indicator (Decision 014 — adopted) → `breakEven`
- [x] Per-prize odds (quantity ÷ N) for the future odds sheet
- [x] Edge-case guards (margin ≥ 1, N ≤ 0, empty pool) with clear errors → `lib/errors.ts` / `EngineError`
- [x] **Engine unit tests** covering every formula + the worked example + edge cases → `tests/engine.test.ts` (31)

**The UI (after the engine is green)**
- [x] Prize-pool input (add/edit/remove items; bulk-add filler) → `components/calculator/PrizePoolEditor.tsx`
- [x] Game-type picker (finite-pool family) with per-type defaults → `SolverPanel.tsx`
- [x] Solver panel: pick which two of {price, #chances, margin} to fix; show the third → `SolverPanel.tsx`
- [x] Results dashboard: cut three ways + hit rate + tier breakdown + volatility + break-even → `ResultsDashboard.tsx`
- [x] Sensible empty/loading/error states; mobile-friendly layout → `Calculator.tsx` (incomplete/error/ok outcome)
- [x] Manual QA against the worked example from `docs/CLAUDE.md` (SSR-verified; owner click-through pending)

---

## Phase 2 — Save & Reuse  *(✅ COMPLETE — Sprint 2 built + DB live + RLS verified 2026-06-05; owner browser click-through confirmed 2026-06-06)*
- [x] Supabase project + auth (login) — project `txrlpwvmawwfuuzedfbw`; email+password (Decision 023)
- [x] Schema + migration for saved games & prize items (see `docs/modules/database-schema.md`) — applied via `db push`
- [x] Save / load / rename / duplicate / delete game setups — `lib/saved-games/*` + `SavedGamesBar.tsx`
- [x] Row-level security (a user sees only their own games) — **verified end-to-end against the live DB**
- [x] Owner browser click-through: sign up → save → reopen → duplicate (final Phase 2 gate — **confirmed 2026-06-06**)
- [ ] (Optional) disable email confirmation in the Supabase dashboard for instant signup

## Phase 3 — Customer Odds Sheet  *(✅ Sprint 3 built + owner-verified — 2026-06-06; print/PDF first, Decision 027)*
- [x] Odds-sheet view derived from engine output (per-prize odds, pool value) — pure `lib/odds-sheet/build.ts` (Decision 028)
- [x] Print stylesheet — `@media print` in `app/globals.css`; **public share link deferred to Phase 3+ (Decision 027)**
- [x] Vendor branding / disclaimer line — optional editable shop/event name + disclaimer in `OddsSheetView.tsx`
- [x] "Customer odds sheet" entry point per saved game — `SavedGamesBar.tsx` → `/games/{id}/odds`
- [x] Hard rule: NO cost/profit/margin on the customer sheet — enforced by `tests/odds-sheet.test.ts`
- [ ] (Deferred) Public no-login share link — needs a share token + public-read path that still hides cost (Phase 3+)

## Phase 4 — Price Lookup  *(✅ Sprint 4 BUILT + owner-verified — 2026-06-06; singles via pokemontcg.io)*
- [x] Implement the price-source interface against pokemontcg.io / TCGPlayer — `lib/prices/*` (Decision 029)
- [x] Card search → auto-fill market value — `CardSearch.tsx` + `Calculator.handleAddFromCard` (owner-verified)
- [x] Cache / rate-limit handling — `app/api/prices/search/route.ts` (24h in-memory cache + per-process rate guard)
- [x] Pure extraction unit-tested — `tests/prices.test.ts` (8); host-agnostic `<img>` for thumbnails (Decision 030)
- [ ] (Permanently manual) Graded (PSA/BGS/CGC) — no free source (not in TCGPlayer's catalog)

## Phase 4 / Sprint 4.5 — Sealed-product pricing via tcgcsv  *(✅ BUILT + owner-verified — 2026-06-06; Decisions 031–032)*
- [x] Research sync/index design (live tcgcsv probes + Gemini consult) + plan before building
- [x] `sealed_products` table + RLS (`select using(true)`, service-role-only writes) + pg_trgm index — applied to remote DB
- [x] Empirically-validated sealed detection (no `Number`/`Rarity`) — `lib/sealed/classify.ts` + 8 tests (Decision 032)
- [x] Sync core `lib/sealed/sync.ts` (single full-sync path, ≈4.6s) + cookie-free clients `lib/sealed/db.ts`
- [x] Local populate via `npx tsx scripts/sync-sealed.ts` — **1,848 sealed products** across 217 sets
- [x] Nightly Vercel Cron `app/api/cron/sync-sealed` + `vercel.json` (CRON_SECRET-protected) — code ready
- [x] `TcgCsvPriceSource` + `CompositePriceSource` (sealed first) behind the existing interface
- [x] `CardSearch` Sealed badge + type label; `handleAddFromCard` sets prize `type=sealed`; `kind` on candidate
- [ ] (Deferred to Phase 5 deploy) Set `CRON_SECRET` + service-role key in the Vercel dashboard to activate the cron

## Phase 5 — Launch  *(✅ COMPLETE — Sprint 5, 2026-06-06; live at https://mysterycalc.vercel.app)*
- [x] Polish + accessibility pass — app-wide `SiteFooter`, `<main>` landmarks + skip-to-content link, enriched metadata
- [x] Final public name = "MysteryCalc" (Decision 033, confirms 017)
- [x] Deploy to Vercel (free `.vercel.app`, Hobby) — `mysterycalc.vercel.app` (Decision 034)
- [x] GitHub connected for auto-deploy (push to `origin/main` → production)
- [x] Set Vercel env vars (Supabase prod+dev) + `CRON_SECRET` (prod) → **sealed cron ACTIVE** (`/api/cron/sync-sealed`, daily 09:00 UTC)
- [x] "Not affiliated with Nintendo / The Pokémon Company" footer — app-wide via `SiteFooter` (Decision 012)
- [x] Verified live: home 200, login 200, cron 401-without-secret, price-search API returns sealed candidates
- [ ] (Deferred — Decision 034) Custom domain — add via Vercel dashboard anytime; then set `NEXT_PUBLIC_SITE_URL`
- [ ] (Owner, optional) Supabase Auth Site URL → production + (optional) disable email confirmation
- [ ] (Deferred) Preview-env Supabase vars — CLI v54.6.1 quirk; add via dashboard if preview login/save ever needed

## Sprint 6 — Post-Launch UX Overhaul  *(✅ COMPLETE — Session 8, 2026-06-07)*
- [x] Design system: violet+gold OKLCH palette (light+dark), Space Grotesk, aurora, gradients; fixed `--font-sans` bug (Decision 035)
- [x] `/guide` field-guide page + game-type info panel (`lib/games/game-info.ts`)
- [x] Profit goal in 3 units (% / $ / ×) — `lib/games/goal.ts` + tests (Decision 036)
- [x] Search: raised caps + relevance ranking across sources + set-name matching — `lib/prices/relevance.ts` + tests (Decision 037)
- [x] Dark mode via `next-themes` (system default, no FOUC); toggle in header + footer (Decision 035)
- [x] Mobile pass: prize editor + odds table → stacked cards <sm; fixed ≤390px header overflow; "via TCGPlayer" attribution; empty state

## Sprint 7 — Live Game Board  *(✅ COMPLETE — data layer Session 8; app Session 9. Decisions 038–039)*
- [x] Migration `20260607120000_live_game_board.sql` applied to remote + RLS verified (two-table public/secret split, token-checked RPCs)
- [x] Step 2 — Controller (phone): `StartLiveBoard` → `create_live_game` (token to localStorage); `app/board/[code]/control` → `BoardController` with Mark-won/Undo steppers, "common pulled", panel toggles, offline banner, end-board
- [x] Step 3 — Display (iPad): `app/board/[code]` → `BoardDisplay` subscribing to `postgres_changes` (re-fetch on reconnect), four toggle-driven panels + animated counts + "scan to watch" QR (`qrcode.react`); code-entry landing `app/board/page.tsx` → `JoinBoardForm`
- [x] Step 4 — Resilience (whole-state writes self-heal; reconnect catch-up) + 18 pure-logic tests (`tests/live-board.test.ts`)
- [x] Verified: typecheck/lint/88 tests/build green; live RPC round-trip (token enforcement + no secret leak) + Realtime delivery confirmed against remote
- [x] **Owner live walk-through (Session 10, 2026-06-08):** phone controller + Mac-mini-monitor display against prod; real-time sync verified on real devices — "works really well." Board owner-verified live.

## Deferred / Future  *(explicitly out of current scope)*
- [ ] ~~Claw / UFO catcher~~ — out permanently (no fixed pool of chances)
- [ ] Live Box Breaks model (separate cost + pull-value math)
- [ ] Buyer "should I play / live odds" mode
