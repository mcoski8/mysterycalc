# MASTER_HANDOFF_01 — Sessions 1+

> Append-only session journal. When this file passes ~15KB, close it with a summary header and start
> `MASTER_HANDOFF_02.md` (and point `CURRENT_PHASE.md` at the new file).

---

## Session 1 — 2026-06-05 — Project kickoff + full documentation build-out

**Summary.** Defined MysteryCalc from scratch, locked product + scope with the owner, validated the economic
model with Gemini, and built the complete documentation system (mirroring PokeSentry / PokeHolder). No
application code — Phase 0 is a planning/sign-off phase.

**What MysteryCalc is.** A free Next.js web app for **vendors** to **design and price mystery games** (the
finite-pool family: oripa, mystery box, wall of sleeves, slab lots, prize wheel, kuji, razz). Enter prizes
(market value AND cost) → pick a game type → fix any two of {buy-in price, # chances, target margin} → it
solves the third → shows the cut three ways (% / $ / pool-multiple), hit rate, prize-tier breakdown, and
break-even. Plus a printable customer odds sheet. Save/reuse games. Stack mirrors PokeHolder.

**Work done.**
- Research: `docs/research/japanese-vs-american-mystery-games.md`, converged with Gemini over two rounds.
  (Gemini added Live Box Breaks + Prize Wheels; the one factual dispute — TPCi graded-slab event-ban date —
  was resolved against live 2026 sources to **May 30, 2026, Indianapolis Regionals**.)
- Owner Q&A locked the product → **Decisions 001–013** in `DECISIONS_LOG.md`.
- Economic model validated with Gemini: V/N/P/margin; solve-for-anything; the **Σ(quantities)=N**
  "every-chance-wins" rule (→ filler + auto-balance); market-vs-cost; and the key addition — output the
  **prize-value distribution / hit rate**, not just the mean margin.
- Built the full doc skeleton (see Files below).

**Key files created.**
- Root: `PROCESS.md`, `CLAUDE.md` (pointer → `AGENTS.md`), `AGENTS.md`, `README.md`, `.gitignore`.
- `docs/`: `PROPOSAL.md` (sign-off gate), `CLAUDE.md` (master context), `DECISIONS_LOG.md` (001–013),
  `CURRENT_PHASE.md`, `checklist.md`, `session-end-prompt.md`.
- `docs/sprints/`: `SPRINT_INDEX.md`, `s0-foundation.md`, `s1-core-calculator.md`.
- `docs/handoff/`: `MASTER_HANDOFF_01.md` (this file).
- `docs/research/`: `japanese-vs-american-mystery-games.md`.
- `docs/modules/`: `calculation-engine.md`, `prize-pool.md`, `game-types.md`, `odds-sheet.md`,
  `price-sources.md`, `database-schema.md`.

**Decisions made.** 001–013 (audience, scope, stack, market+cost, three-way cut, manual-entry-first, odds
sheet, save/reuse, filler+auto-balance, game-feel outputs, sell-through [pending], tone, doc-system). See
`DECISIONS_LOG.md`. **Decision 011 (sell-through indicator) is PENDING owner confirmation.**

**Issues / gotchas for next session.**
- The engine MUST implement Σ(quantities)=N filler auto-balance and the game-feel outputs from the start.
- Keep `lib/` pure (no React/DB) and test-first; the engine is the product.
- Next.js will be the latest version, **newer than training** — read `node_modules/next/dist/docs/` before
  writing app code.
- Owner-side gambling-adjacency: keep the tone neutral; transparency features are a feature, not an afterthought.

**Open items (need owner input — `docs/PROPOSAL.md` §10).**
1. Sell-through indicator: keep in v1 or defer? (Decision 011)
2. Typical game size (tens / hundreds / ~1,000 chances)?
3. Razz: keep in v1 or drop (US legal sensitivity)?
4. Final public name ("MysteryCalc"?).
5. Any other changes to §1–§9 before sign-off.

**Next steps.** Get owner sign-off on `PROPOSAL.md` (log resolutions as Decisions 014+), then start Phase 1
Sprint 1 (Core Calculator): scaffold Next.js, then build + test the pure calc engine in `lib/` before any UI.

---

## Session 1 (cont.) — 2026-06-05 — Proposal SIGNED OFF; Phase 0 complete

- Owner reviewed the proposal via a plain-text summary and resolved all 5 open items → **Decisions 014–018**:
  (014) break-even indicator IN v1; (015) typical game size ~10–500 chances, design for tens–to–hundreds with
  bulk filler; (016) razz KEPT in v1 (single-winner marked on odds sheet); (017) "MysteryCalc" = working
  codename, final name pre-launch; (018) **"lock it"** — proposal signed off, no changes.
- `docs/PROPOSAL.md` → status SIGNED OFF, §10 marked resolved. **Phase 0 (Planning & Docs) COMPLETE; Phase 1
  (Core Calculator) cleared to begin.**
- Docs updated: `DECISIONS_LOG.md` (014–018), `checklist.md`, `SPRINT_INDEX.md` (S0 Complete / S1 Next),
  `s0-foundation.md`, this handoff, and `CURRENT_PHASE.md` (rewritten).
- **Next:** Phase 1 / Sprint 1 — scaffold Next.js (latest, read bundled docs first), then build + test the pure
  calculation engine in `lib/` BEFORE any UI, per `docs/sprints/s1-core-calculator.md` +
  `docs/modules/calculation-engine.md`. Owner to say when to start the build.

---

## Session 2 — 2026-06-05 — Phase 1 / Sprint 1 BUILT: engine, tests, and calculator UI

**Summary.** Built the entire Core Calculator (Sprint 1) in one session: scaffolded the app, wrote the pure
calculation engine **test-first**, then the full interactive UI. Everything is green and the official worked
example reproduces **exactly** in the running app. **Phase 1 exit criterion is MET.**

**Pre-flight (all pass):** `npm run typecheck` ✅ · `npm run lint` ✅ · `npm test` → **31/31** ✅ ·
`npm run build` ✅. SSR smoke test of the seeded page confirms: **margin 41%**, profit **$1,465**, revenue
**$2,000**, avg value **$11.80**, pool multiple **1.69×**, hit rate **5%**, break-even **27 sleeves**,
volatility **high** — i.e. the `docs/CLAUDE.md` worked example, end to end.

**Stack realized (Decision 020).** Next.js **16.2.7** (Turbopack default; `next lint` removed → `lint` is
`eslint .`; async request APIs), React **19.2.4**, Tailwind **v4**, shadcn/ui (Nova/radix), Vitest **3.2.6**.
Read the bundled `node_modules/next/dist/docs/.../version-16.md` upgrade guide before writing app code, per
`AGENTS.md` rule 5. Scaffolded in `/tmp` and merged into the repo to preserve the existing docs / `AGENTS.md`
/ `.gitignore`.

**Files created.**
- *Engine (pure TS, no React/DB):* `lib/types.ts`, `lib/errors.ts` (`EngineError` + codes), `lib/games/game-types.ts`
  (7-type registry), `lib/pool/pool.ts` (totals, `validatePool`, `fillerNeeded`, `balanceFiller`),
  `lib/engine/engine.ts` (`marginFor`/`priceFor`/`chancesFor`, `breakEven`, game-feel, `solveGame`),
  `lib/engine/index.ts` (barrel → `@/lib/engine`). Tests: `tests/engine.test.ts` (31).
- *UI:* `components/calculator/{Calculator,SolverPanel,PrizePoolEditor,ResultsDashboard}.tsx`,
  `app/page.tsx` (server shell + disclaimer), `app/layout.tsx` (metadata), `lib/format.ts`, `lib/brand.ts`.
- *Config:* `package.json` (scripts), `vitest.config.ts`, `components.json`, `components/ui/*` (shadcn).

**Decisions logged:** D-020 (stack + Vitest-UI advisory: stay on v3, the advisory only hits `vitest --ui`
which we never run), D-021 (solve-for holds pool value V fixed; warns instead of silently rebalancing filler —
matches the worked example), D-022 (razz = one winner takes the whole listed pool + N−1 implicit $0 spots).

**Open / next (Phase 2 — Save & Reuse):** Supabase auth + storage so a vendor can save, reopen, and
duplicate games (the Phase 1 calculator stays login-free). See `docs/modules/database-schema.md`. NB: the
PokeDrop/PokeHolder note about Supabase migration-history drift is a *different* project — start MysteryCalc's
Supabase clean.

**Landmines for next session:**
- **Vitest UI advisory (GHSA-5xrq-8626-4rwp):** dev-only, `vitest --ui`-only; not in our scripts. Don't
  "fix" it with a breaking v4 bump unless we add the UI.
- **Solve-for-N can yield N ≠ listed prize count** → engine WARNS (intended, per D-021). Not a bug.
- **Razz + multi-item pool:** winner takes ALL items; switching the seeded pool to razz fires a "razz has no
  filler" warning until the vendor trims to the real single prize (per D-022).
- Owner has not yet clicked through the UI in a browser (verified via SSR only) — worth a human pass.

---

## Session 3 — 2026-06-05 — Phase 2 / Sprint 2: Save & Reuse (built + DB live + RLS verified)

**Accomplished.** Built Phase 2 end-to-end and verified the database half live. Email + password auth on the
Next.js 16 SSR pattern, full saved-games CRUD, wired into the calculator without breaking the logged-out
experience. Provisioned the real Supabase project, applied the migration, and verified the whole data path +
RLS against the live DB (then cleaned up). Pre-flight all green: typecheck ✅, lint ✅, **37/37 tests ✅**
(31 engine + 6 serialization), build ✅.

**Files added.**
- *Supabase plumbing:* `lib/supabase/{client,server,proxy,configured}.ts`, root `proxy.ts` (Next 16 renamed
  middleware→proxy).
- *Auth:* `app/login/page.tsx`, `app/login/actions.ts`, `components/account/{LoginForm,AccountMenu}.tsx`,
  `app/auth/confirm/route.ts`.
- *Saved games:* `lib/saved-games/serialize.ts` (pure, tested), `lib/saved-games/actions.ts` (server actions),
  `components/calculator/SavedGamesBar.tsx`, `tests/saved-games.test.ts`.
- *DB:* `supabase/config.toml`, `supabase/migrations/20260605120000_init_saved_games.sql`.
- *Env:* `.env.example` (committed template); `.env.local` (gitignored, holds the live keys).

**Files changed.** `lib/types.ts` (+`LeadMetric`), `components/calculator/Calculator.tsx` (lifts lead-metric +
snapshot + applySnapshot + SavedGamesBar + `userEmail` prop), `components/calculator/ResultsDashboard.tsx`
(controlled lead, `"margin"`→`"percent"`), `app/page.tsx` (reads session, AccountMenu, passes userEmail),
`package.json`/lock (+@supabase/ssr, @supabase/supabase-js).

**Decided (see DECISIONS_LOG.md):** D-023 login = email+password; D-024 SSR auth architecture (@supabase/ssr +
proxy.ts + server-action/RLS enforcement + graceful degradation); D-025 saved-games schema & serialization
(NULL the solved knob, DB CHECK enforces no-drift, margin as fraction, `position`, lifted lead-metric);
D-026 live provisioning + verification record (project `txrlpwvmawwfuuzedfbw`).

**Live verification (real DB, cleaned up after).** Two confirmed users via admin API; A inserts game + 2
prize_items → A reads 1 / B reads 0 (own), B reads 0 of A's by id, B reads 0 of A's prize_items (RLS); CHECK
rejects non-NULL solved knob; B cannot insert as A (RLS). All passed.

**Open / next.**
1. **Owner browser click-through** (the only thing left for the Phase 2 gate): at `npm run dev`, sign up,
   build a game, Save, reload, reopen it, duplicate it.
2. **Optional:** disable email confirmation for instant signup (Dashboard → Authentication → Sign In /
   Providers → Email → off "Confirm email"). Signup already works without this via `/auth/confirm`.
3. Then **Phase 3 — Customer Odds Sheet** (per-prize odds already computed by the engine).

**Landmines.**
- **Next 16: `middleware`→`proxy`.** File `proxy.ts`, fn `proxy`, Node runtime, matcher excludes static assets.
- **Don't trust the proxy for authz** — it only refreshes the cookie; server actions re-check the user + RLS is
  the boundary (verified).
- **Email confirmation likely ON by default** — handled by `/auth/confirm`; turn off for smoother signup.
- **Public key = legacy anon JWT** (verified). `sb_publishable_…` fallback is commented in `.env.local`.
- **Secrets only in gitignored `.env.local`.** Never commit; never expose the service-role key client-side.
- Home page is now dynamic (`ƒ`) because it reads the session — expected.

---

## Session 4 — 2026-06-06 — Phase 2 gate closed + Phase 3 (Customer Odds Sheet) built

**Accomplished.**
- **Phase 2 gate fully closed:** owner did the browser click-through (sign up → build → save → reload →
  reopen → duplicate) and confirmed it works. S2 and Phase 2 are now Complete.
- **Phase 3 — Customer Odds Sheet built (print/PDF first) and owner-verified in the browser** incl. print
  preview. It turns a *saved* game into a clean customer-facing sheet (prize pool + odds), reachable from "My
  games." Pre-flight all green: typecheck ✅, lint ✅, **41/41 tests ✅** (4 new), build ✅. Unauthenticated
  `/games/[id]/odds` correctly 307s → `/login` (curl-verified).

**Files (new unless noted).**
- `lib/odds-sheet/build.ts` — pure `buildOddsSheet(snapshot, name)` → `OddsSheet` view-model. Reuses the
  engine's `perPrizeOdds` (no new math). **Builds no cost/profit/margin field** — the customer-safe boundary.
- `lib/saved-games/serialize.ts` (mod) — added pure `snapshotToSolveInput(snapshot)` → `{ items, config }`.
- `lib/saved-games/actions.ts` (mod) — added auth-checked `loadGameForSheet(id)` → `{ name, snapshot }`.
- `app/games/[id]/odds/page.tsx` — auth-gated Server Component (load → build → render; EngineError → friendly
  message). Next 16: `params` is a Promise (awaited).
- `components/odds-sheet/OddsSheetView.tsx` — printable sheet + optional editable shop name + Print/Back
  (`.no-print`). Odds as `%` and "1 in N". Razz single-winner note.
- `app/globals.css` (mod) — `@media print` rules.
- `components/calculator/SavedGamesBar.tsx` (mod) — per-game "Customer odds sheet" link (scroll icon, new tab).
- `tests/odds-sheet.test.ts` — 4 tests incl. the **no-cost/profit/margin-leak** guard.

**Decided.** D-027 (Phase 3 = print/PDF first; public share link deferred to Phase 3+). D-028 (odds-sheet
architecture: pure builder + test-enforced customer-safe boundary). See DECISIONS_LOG.md.

**Open / next.**
1. **Phase 4 — Price Lookup** is the next phase: search a card → market value auto-fills (pokemontcg.io /
   TCGPlayer behind a pluggable interface; manual entry stays as fallback). See `docs/modules/price-sources.md`.
2. **Deferred within Phase 3:** the public no-login **share link** (share token + public-read path that still
   hides cost/profit — do NOT relax RLS on `games`/`prize_items`, those rows contain cost).
3. **Known debt:** broad UI/UX polish pass (owner noted) — slot into Phase 5 (Launch), not blocking.

**Landmines.**
- **Don't construct JSX inside a `try/catch`** in a Server Component (ESLint `react-hooks/error-boundaries`).
  Compute into a variable in the `try`, return JSX after.
- **`perPrizeOdds` carries no market value** — the sheet merges value by item position; razz's trailing "No
  prize" line has no item (worth $0). Revisit if the engine ever reorders `perPrizeOdds`.
- **Shop name is transient** (on-page only, not saved) — a persisted vendor brand is a future enhancement.
