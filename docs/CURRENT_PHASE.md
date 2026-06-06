# Current: Phase 1 / Sprint 1 (Core Calculator) ✅ COMPLETE — **Phase 2 (Save & Reuse) is next.**

> Updated: 2026-06-05 (end of Session 2 — Sprint 1 build)
> Status: **Phase 1 / Sprint 1 (Core Calculator) COMPLETE.** The pure calculation engine and the full
> calculator UI are built, tested, and verified. **Phase 1 exit criterion is MET** (a vendor can build a pool,
> fix any two of {price, #chances, margin}, and get the third plus the game-feel outputs, in the browser).
> Active handoff: **`docs/handoff/MASTER_HANDOFF_01.md`** (Session 2 appended; ~9KB, no roll yet).
> Anchoring docs: `docs/CLAUDE.md` (master context), `docs/sprints/s1-core-calculator.md` (just-finished sprint),
> `docs/modules/calculation-engine.md` (the math, now implemented), `docs/PROPOSAL.md` (signed off),
> `docs/DECISIONS_LOG.md` (001–022).

---

## What MysteryCalc is (one paragraph)

A free web app for **vendors** to **design and price mystery games** (oripa, mystery boxes, walls of sleeves,
prize wheels, kuji, razzes — the finite-pool family). Enter prizes (market value AND your cost), pick a game
type, set any two of {buy-in price, number of chances, target margin}, and it solves the third — then shows
profit three ways, hit rate, prize-tier breakdown, and break-even. Plus (later) a printable customer odds
sheet and saved games. Stack: Next.js 16 + Supabase + Vercel (same as PokeHolder).

## What was completed (Session 2 — Sprint 1)

- **Scaffold + tooling:** Next.js **16.2.7** (Turbopack default), React 19.2.4, Tailwind v4, shadcn/ui
  (Nova/radix), **Vitest 3.2.6**. Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`.
- **Pure calculation engine** in `lib/` (no React/DB), built test-first:
  - `lib/types.ts`, `lib/errors.ts`, `lib/games/game-types.ts`, `lib/pool/pool.ts`, `lib/engine/engine.ts`,
    `lib/engine/index.ts` (barrel → `@/lib/engine`).
  - Solve-for {N, P, m}; filler auto-balance (Σqty=N); razz; cut three ways; hit rate + chase/win/dud tiers +
    volatility; break-even; per-prize odds; loud `EngineError` edge guards.
  - **`tests/engine.test.ts` — 31 tests, all passing.** The worked example reproduces exactly.
- **Calculator UI** (`app/` + `components/calculator/`): game picker + solve-for toggle, prize-pool editor
  with one-click "Balance filler to N", and a results dashboard (cut three ways with a lead toggle, hit rate,
  stacked tier bar, volatility badge, per-prize odds table). Seeded with the worked example.
- **All pre-flight green:** typecheck ✅, lint ✅, 31/31 tests ✅, build ✅. SSR smoke test confirms the live
  page shows margin 41% / profit $1,465 / break-even 27 / hit rate 5% / volatility high.
- **Decisions 020–022 logged** (stack + Vitest advisory call; V-held-fixed solve; razz modeling).

## In progress

- Nothing actively coding. Sprint 1 is closed.

## Not started yet

- **Phase 2 — Save & Reuse:** Supabase project + auth, schema/migration for saved games, save/load/rename/
  duplicate/delete, row-level security. (`docs/modules/database-schema.md`.)
- Phase 3 (odds sheet), Phase 4 (price lookup), Phase 5 (launch).

## Blockers / open items

- **None blocking.** Soft follow-up: the owner hasn't yet clicked through the UI in a real browser (it's been
  verified programmatically via SSR). A human pass would be worthwhile before Phase 2.

## Gotchas / lessons

- **Vitest UI advisory (GHSA-5xrq-8626-4rwp)** affects only `vitest --ui`, which we never run — staying on
  Vitest 3 is deliberate (Decision 020). Don't force a breaking v4 bump to silence `npm audit`.
- **Solve-for-N holds pool value V fixed (Decision 021):** the solved N can differ from the listed prize
  count; the engine WARNS ("add filler to reach N"). Intended — it matches the worked example.
- **Razz (Decision 022):** the single winner takes the entire listed pool; N−1 implicit $0 spots drive the
  feel stats. Switching the seeded pool to razz fires a (correct) "razz has no filler" warning.
- Next.js 16 is newer than training: Turbopack is default, `next lint` is removed (`lint` = `eslint .`),
  request APIs are async. Read `node_modules/next/dist/docs/` before app code.

## Immediate next actions (Phase 2 / Sprint 2 — Save & Reuse)

1. Stand up a **Supabase project** for MysteryCalc (clean — the Supabase migration-drift note in memory is a
   different project). Wire env vars locally and on Vercel.
2. Add **auth** (login) while keeping the Phase 1 calculator fully usable logged-out.
3. Design the **schema + migration** for saved games + their prize items (`docs/modules/database-schema.md`),
   with **row-level security** so a user sees only their own games.
4. Build **save / load / rename / duplicate / delete** of game setups on top of the existing calculator state.
5. Keep `docs/sprints/` (open an `s2-*.md`), `checklist.md`, and `SPRINT_INDEX.md` updated as work lands.

## Resume prompt for next session

```
MysteryCalc — Phase 1 / Sprint 1 (Core Calculator) is COMPLETE and committed. The Next.js 16 app is
scaffolded; the PURE calculation engine (lib/) is built and covered by 31 passing Vitest tests; and the full
calculator UI is shipped and SSR-verified to reproduce the worked example exactly (margin 41%, profit $1,465,
break-even 27, hit rate 5%, volatility high). All pre-flight checks pass (typecheck/lint/test/build). Phase 1
exit gate is MET.

WHAT MYSTERYCALC IS: a free Next.js web app for VENDORS to design & price mystery games (oripa, mystery boxes,
walls of sleeves, prize wheels, kuji, razz — the finite-pool family). Enter prizes (market value AND cost) →
pick a game type → set any two of {buy-in P, # chances N, target margin m} → solve the third → see profit
three ways (% / $ / pool-multiple), hit rate, prize-tier breakdown, break-even. Stack: Next.js 16 + TS +
Tailwind v4 + shadcn + (Phase 2) Supabase + Vercel.

KEY CODE: engine in lib/engine/engine.ts (+ barrel lib/engine/index.ts → @/lib/engine), pool helpers in
lib/pool/pool.ts, game registry lib/games/game-types.ts, types lib/types.ts, errors lib/errors.ts; tests in
tests/engine.test.ts. UI in components/calculator/{Calculator,SolverPanel,PrizePoolEditor,ResultsDashboard}.tsx,
page app/page.tsx. Scripts: npm run dev/build/typecheck/lint/test.

THIS SESSION = Phase 2 / Sprint 2 (Save & Reuse): stand up a CLEAN Supabase project, add login (keep the
Phase 1 calculator usable logged-out), design the saved-games schema + migration with row-level security
(docs/modules/database-schema.md), then build save/load/rename/duplicate/delete. Don't write later-phase
(odds-sheet / price-lookup) code yet.

GOTCHAS: Vitest UI advisory affects only `vitest --ui` (we never run it) — stay on Vitest 3 (Decision 020).
Solve-for-N holds pool value V fixed and WARNS if N ≠ prize count (Decision 021). Razz = one winner takes the
whole listed pool + N−1 implicit $0 spots (Decision 022). Next.js 16 is newer than training — Turbopack is
default, `next lint` is gone, request APIs are async; read node_modules/next/dist/docs/ before app code.

READ AT SESSION OPEN: docs/CLAUDE.md, docs/CURRENT_PHASE.md, docs/sprints/SPRINT_INDEX.md, the new s2 sprint
file, docs/modules/database-schema.md, and DECISIONS_LOG.md (001–022). Follow AGENTS.md (comment standard for
technical + semi-non-technical readers; append-only docs; stay in-phase).

AT SESSION CLOSE: follow docs/session-end-prompt.md line by line; update the sprint file + checklist +
SPRINT_INDEX; append DECISIONS + handoff; rewrite this file; commit + push to origin/main (Decision 019,
pre-authorized); end with the verbatim resume prompt.
```

---

*This file is REWRITTEN (not appended) at the end of every session.*
