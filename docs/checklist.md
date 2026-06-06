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

## Phase 2 — Save & Reuse  *(✅ Sprint 2 built + DB live + RLS verified — 2026-06-05; owner browser click-through pending)*
- [x] Supabase project + auth (login) — project `txrlpwvmawwfuuzedfbw`; email+password (Decision 023)
- [x] Schema + migration for saved games & prize items (see `docs/modules/database-schema.md`) — applied via `db push`
- [x] Save / load / rename / duplicate / delete game setups — `lib/saved-games/*` + `SavedGamesBar.tsx`
- [x] Row-level security (a user sees only their own games) — **verified end-to-end against the live DB**
- [ ] Owner browser click-through: sign up → save → reopen → duplicate (final Phase 2 gate confirmation)
- [ ] (Optional) disable email confirmation in the Supabase dashboard for instant signup

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
