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

## Phase 1 — Core Calculator (MVP)  *(not started — begins after sign-off)*

### Sprint 1: Core Calculator
**Scaffold**
- [ ] Scaffold Next.js (App Router) + TypeScript project (latest Next.js — read bundled docs first)
- [ ] Set up Tailwind + shadcn/ui
- [ ] Configure ESLint + typecheck + a test runner (Vitest), and `npm` scripts

**The calculation engine (pure TS in `lib/` — build and test BEFORE any UI)**
- [ ] Types: prize item (name, type, market value, cost, quantity, isFiller), game config, results
- [ ] Pool value `V` = Σ(market value × quantity); pool cost = Σ(cost × quantity)
- [ ] Solve-for: `N` from (V,P,m); `P` from (V,N,m); `m` from (V,N,P)
- [ ] Filler auto-balance so Σ(quantities) = N for every-chance-wins games
- [ ] Razz special case (1 prize, N chances)
- [ ] Cut three ways: margin %, profit $ (uses cost), pool multiple
- [ ] Game-feel outputs: hit rate (% chances ≥ buy-in), prize-tier buckets, volatility
- [ ] Break-even / sell-through indicator (pending Decision 011 confirmation)
- [ ] Per-prize odds (quantity ÷ N) for the future odds sheet
- [ ] Edge-case guards (margin ≥ 1, N ≤ 0, empty pool) with clear errors
- [ ] **Engine unit tests** covering every formula + the worked example + edge cases

**The UI (after the engine is green)**
- [ ] Prize-pool input (add/edit/remove items; bulk-add filler)
- [ ] Game-type picker (finite-pool family) with per-type defaults
- [ ] Solver panel: pick which two of {price, #chances, margin} to fix; show the third
- [ ] Results dashboard: cut three ways + hit rate + tier breakdown + volatility + break-even
- [ ] Sensible empty/loading/error states; mobile-friendly layout
- [ ] Manual QA against the worked example from `docs/CLAUDE.md`

---

## Phase 2 — Save & Reuse  *(not started)*
- [ ] Supabase project + auth (login)
- [ ] Schema + migration for saved games & prize items (see `docs/modules/database-schema.md`)
- [ ] Save / load / rename / duplicate / delete game setups
- [ ] Row-level security (a user sees only their own games)

## Phase 3 — Customer Odds Sheet  *(not started)*
- [ ] Odds-sheet view derived from engine output (per-prize odds, pool value)
- [ ] Print stylesheet + shareable link
- [ ] Vendor branding / disclaimer line

## Phase 4 — Price Lookup  *(not started)*
- [ ] Implement the price-source interface against pokemontcg.io / TCGPlayer
- [ ] Card search → auto-fill market value
- [ ] Cache / rate-limit handling

## Phase 5 — Launch  *(not started)*
- [ ] Polish + accessibility pass
- [ ] Deploy to Vercel
- [ ] Custom domain
- [ ] "Not affiliated with Nintendo / The Pokémon Company" footer

## Deferred / Future  *(explicitly out of current scope)*
- [ ] ~~Claw / UFO catcher~~ — out permanently (no fixed pool of chances)
- [ ] Live Box Breaks model (separate cost + pull-value math)
- [ ] Buyer "should I play / live odds" mode
