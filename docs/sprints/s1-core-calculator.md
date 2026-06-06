# Sprint 1 — Core Calculator (MVP)

> **Phase:** 1 (Core Calculator / MVP)
> **Status:** Not Started — begins after the owner signs off on `docs/PROPOSAL.md` (Phase 0 exit gate).
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
| 1 | Scaffold Next.js (App Router) + TS (read bundled docs — newer than training) | Pending |
| 2 | Tailwind + shadcn/ui; ESLint, typecheck, Vitest, npm scripts | Pending |
| 3 | Engine types (prize item, game config, results) | Pending |
| 4 | Pool value `V` and pool cost | Pending |
| 5 | Solve-for: N, P, m | Pending |
| 6 | Filler auto-balance (Σ quantities = N) | Pending |
| 7 | Razz special case | Pending |
| 8 | Cut three ways (margin %, profit $, pool multiple) | Pending |
| 9 | Game-feel outputs (hit rate, tier buckets, volatility) | Pending |
| 10 | Break-even / sell-through (pending Decision 011) | Pending |
| 11 | Per-prize odds (quantity ÷ N) | Pending |
| 12 | Edge-case guards + clear errors | Pending |
| 13 | Engine unit tests (formulas + worked example + edges) | Pending |
| 14 | Prize-pool input UI | Pending |
| 15 | Game-type picker | Pending |
| 16 | Solver panel (fix two → show third) | Pending |
| 17 | Results dashboard | Pending |
| 18 | Empty/loading/error states; mobile layout | Pending |
| 19 | Manual QA vs the worked example | Pending |

## Acceptance checks

- The worked example (V=$1,180, N=100, P=$20 → margin 41%; 35% at $20 → ~91 chances) reproduces exactly.
- Filler auto-balance keeps prize count = N as the vendor edits items.
- Razz computes correctly with a single prize and N chances.
- All three cut metrics agree on the same underlying outcome.
- Hit rate and tier buckets are correct for a hand-checked pool.
- Edge cases (margin ≥ 1, N ≤ 0, empty pool) fail loudly with readable messages, never silently.

## Session Log

*(none yet — sprint not started)*
