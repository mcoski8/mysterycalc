# Sprint 1 — Core Calculator (MVP)

> **Phase:** 1 (Core Calculator / MVP)
> **Status:** ✅ **COMPLETE (2026-06-05).** Engine built + tested (31 passing), full calculator UI shipped,
> worked example reproduces exactly in the running app. Phase 1 exit criterion MET. Owner UX click-through is
> a soft follow-up (verified programmatically via SSR, not yet by a human in the browser).
> **Goal:** A working, login-free, in-browser calculator for the finite-pool game family: enter a prize
> pool, fix any two of {buy-in price, number of chances, target margin}, get the third, plus the full set
> of game-feel outputs.
> **Exit criterion:** A vendor can build a pool, set any two of {price, #chances, margin}, and see the third
> + profit (three ways) + hit rate + prize-tier breakdown + break-even, all in the browser.

---

## Build order (important)

1. **Scaffold** the Next.js + TS project and tooling.
2. **Build the pure calculation engine in `lib/` FIRST, with tests.** The engine is the product — it must be
   correct and trivially testable before any UI exists. No React, no DB in `lib/`.
3. **Then build the UI** on top of the green engine.

See `docs/modules/calculation-engine.md`, `docs/modules/prize-pool.md`, and `docs/modules/game-types.md` for
the detailed specs of each piece.

## Task table

| # | Task | Status |
|---|------|--------|
| 1 | Scaffold Next.js (App Router) + TS (read bundled docs — newer than training) | ✅ Done |
| 2 | Tailwind + shadcn/ui; ESLint, typecheck, Vitest, npm scripts | ✅ Done |
| 3 | Engine types (prize item, game config, results) | ✅ Done |
| 4 | Pool value `V` and pool cost | ✅ Done |
| 5 | Solve-for: N, P, m | ✅ Done |
| 6 | Filler auto-balance (Σ quantities = N) | ✅ Done |
| 7 | Razz special case | ✅ Done |
| 8 | Cut three ways (margin %, profit $, pool multiple) | ✅ Done |
| 9 | Game-feel outputs (hit rate, tier buckets, volatility) | ✅ Done |
| 10 | Break-even / sell-through (Decision 014) | ✅ Done |
| 11 | Per-prize odds (quantity ÷ N) | ✅ Done |
| 12 | Edge-case guards + clear errors | ✅ Done |
| 13 | Engine unit tests (formulas + worked example + edges) | ✅ Done (31 tests) |
| 14 | Prize-pool input UI | ✅ Done |
| 15 | Game-type picker | ✅ Done |
| 16 | Solver panel (fix two → show third) | ✅ Done |
| 17 | Results dashboard | ✅ Done |
| 18 | Empty/loading/error states; mobile layout | ✅ Done |
| 19 | Manual QA vs the worked example | ✅ Done (SSR-verified; owner click-through pending) |

## Acceptance checks

- The worked example (V=$1,180, N=100, P=$20 → margin 41%; 35% at $20 → ~91 chances) reproduces exactly.
- Filler auto-balance keeps prize count = N as the vendor edits items.
- Razz computes correctly with a single prize and N chances.
- All three cut metrics agree on the same underlying outcome.
- Hit rate and tier buckets are correct for a hand-checked pool.
- Edge cases (margin ≥ 1, N ≤ 0, empty pool) fail loudly with readable messages, never silently.

## Session Log

### Session 2 — 2026-06-05 — Phase 1 / Sprint 1 BUILT (engine + tests + UI)

**Outcome:** Sprint 1 complete. Scaffolded the app, built the pure calculation engine test-first, then the
full calculator UI. All pre-flight checks pass: typecheck ✅, lint ✅, **31/31 engine tests ✅**, production
build ✅. The seeded worked example reproduces EXACTLY in the running app (SSR-checked): margin 41%, profit
$1,465, revenue $2,000, avg value $11.80, pool multiple 1.69×, hit rate 5%, break-even 27 sleeves,
volatility high.

**Scaffold / tooling.**
- Next.js **16.2.7** (Turbopack default — newer than training; read `node_modules/next/dist/docs/` version-16
  upgrade guide first), React **19.2.4**, Tailwind **v4**, shadcn/ui (Nova preset / radix base), Vitest **3.2.6**.
- Scaffolded in a temp dir and merged the Next files into the repo to preserve the existing docs / `AGENTS.md`
  / `CLAUDE.md` / `README.md` / `.gitignore` (kept the repo's richer `.gitignore`).
- `package.json` scripts: `dev`, `build`, `start`, `lint` (`eslint .` — `next lint` is REMOVED in 16),
  `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:watch`. `vitest.config.ts` maps the `@/` alias.

**Engine (pure TS in `lib/`, no React/DB).**
- `lib/types.ts` — PrizeItem, GameType/GameTypeMeta, GameConfig (with explicit `solveFor`), GameResult.
- `lib/errors.ts` — `EngineError` with machine-readable `code` (fail loudly).
- `lib/games/game-types.ts` — the 7-type registry (words + `everyChanceWins`/`singleWinner` flags + defaults).
- `lib/pool/pool.ts` — `poolValue`/`poolCost`/`prizeCount`/`nonFillerCount`, `validatePool`, `fillerNeeded`,
  `balanceFiller` (pure, replaces stale filler, throws if real prizes exceed N).
- `lib/engine/engine.ts` — `marginFor`/`priceFor`/`chancesFor` (each unit-testable), `breakEven`, game-feel
  (hit rate, chase/win/dud tiers, volatility via coefficient-of-variation), per-prize odds, and the
  `solveGame` orchestrator. `lib/engine/index.ts` is the public barrel (`@/lib/engine`).
- `tests/engine.test.ts` — 31 tests: formulas, pool totals + filler, the worked example three ways, cut
  consistency, razz, warnings, and every edge guard.

**UI (`app/` + `components/calculator/`).**
- `components/calculator/Calculator.tsx` — the only stateful component; holds inputs, runs the engine in a
  `useMemo`, returns a discriminated `incomplete | error | ok` outcome (never a half-baked number). Seeded
  with the worked example so the page is self-demonstrating.
- `SolverPanel.tsx` (game picker + solve-for toggle + 2 inputs, solved field read-only), `PrizePoolEditor.tsx`
  (row table + live V/C/count footer + "Balance filler to N" button), `ResultsDashboard.tsx` (cut three ways
  with a lead toggle, hit rate, stacked tier bar, volatility badge, secondary stats, per-prize odds table).
- `app/page.tsx` (server shell + neutral/disclaimer footer), `app/layout.tsx` (metadata), `lib/brand.ts`
  (APP_NAME in one place — Decision 017), `lib/format.ts` (USD / % / number / multiple formatters).

**Decisions logged this session:** D-020 (realized stack + Vitest-UI advisory call), D-021 (solve-for treats
pool value V as a fixed constant; warns instead of silently rebalancing), D-022 (razz = one winner takes the
whole listed pool + N−1 implicit $0 spots). See `DECISIONS_LOG.md`.

**Gotchas / landmines for next session:**
- **Vitest UI advisory (GHSA-5xrq-8626-4rwp):** only affects `vitest --ui` (we never run it; scripts use
  `vitest run`). Staying on Vitest 3.2.6; the fix is a breaking v4 bump. Re-evaluate if we ever add the UI.
- **Solve-for-N vs prize count:** because V is fixed, solving for N can yield an N ≠ the listed prize count;
  the engine WARNS ("add filler to reach N"). This is intended (matches the worked example), not a bug.
- **Razz with a multi-item pool:** the single winner takes ALL listed items (V = their sum). The seeded
  worked-example filler stays flagged when you switch to razz and triggers a "razz has no filler" warning —
  expected; the vendor edits the pool down to the real single prize.
- Editable numeric fields are stored as strings (so they can be briefly empty) and parsed only at engine call.
