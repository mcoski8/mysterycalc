# Current: Phase 0 COMPLETE ✅ — proposal SIGNED OFF. **Phase 1 (Core Calculator) is next.**

> Updated: 2026-06-05 (proposal sign-off)
> Status: **Phase 0 (Planning & Docs) COMPLETE.** `docs/PROPOSAL.md` signed off by the owner ("lock it"),
> all open items resolved (Decisions 001–018). **Phase 1 (Core Calculator) is cleared to begin — no app code
> written yet.**
> Active handoff: **`docs/handoff/MASTER_HANDOFF_01.md`**
> Anchoring docs: `docs/PROPOSAL.md` (signed off), `docs/CLAUDE.md` (master context),
> `docs/sprints/s1-core-calculator.md` (next sprint), `docs/modules/calculation-engine.md` (the math spec).

---

## What MysteryCalc is (one paragraph)

A free web app for **vendors** to **design and price mystery games** (oripa, mystery boxes, walls of sleeves,
prize wheels, kuji, razzes — the finite-pool family). Enter prizes (market value AND your cost), pick a game
type, set any two of {buy-in price, number of chances, target margin}, and it solves the third — then shows
profit three ways, hit rate, prize-tier breakdown, and break-even. Plus a printable customer odds sheet.
Built on Next.js + Supabase + Vercel (same stack as PokeHolder).

## What was completed (Phase 0)

- Full documentation system built (mirrors PokeSentry/PokeHolder): `PROCESS.md`, root `CLAUDE.md`+`AGENTS.md`,
  `docs/CLAUDE.md`, `docs/PROPOSAL.md`, `DECISIONS_LOG.md`, `CURRENT_PHASE.md`, `checklist.md`,
  `session-end-prompt.md`, sprint index + S0/S1, handoff 01, the JP-vs-US research, and 6 module specs.
- Product + scope locked with the owner and the economic model validated with Gemini → **Decisions 001–018**.
- **`docs/PROPOSAL.md` SIGNED OFF** (Decision 018) — Phase 0 exit gate met.

## In progress

- Nothing actively coding. Awaiting the owner's go to start the Phase 1 build.

## Not started yet

- All application code. The Next.js project is not scaffolded; `lib/`, `app/`, `components/`, `supabase/`,
  `tests/` do not exist.

## Blockers / open items

- **None blocking.** All proposal questions resolved. The only gate is the owner saying "start building"
  (a big step — scaffolding + engine), which is why the build hasn't auto-started.

## Immediate next actions (Phase 1 / Sprint 1 — Core Calculator)

1. **Scaffold** the Next.js (App Router) + TypeScript project — Next.js is the **latest version, newer than
   training**; read `node_modules/next/dist/docs/` before writing app code. Add Tailwind + shadcn/ui, ESLint,
   typecheck, and a test runner (Vitest).
2. **Build the pure calculation engine in `lib/` FIRST, with tests** (engine before UI) — per
   `docs/modules/calculation-engine.md`: pool value/cost, solve-for {N,P,m}, filler auto-balance (Σqty=N),
   razz special case, cut three ways, hit rate + tier buckets + volatility, break-even, per-prize odds, and
   loud edge-case guards. The worked example must reproduce exactly.
3. **Then build the UI** on the green engine: prize-pool input (with bulk filler), game-type picker, solver
   panel (fix two → show third), results dashboard.
4. Keep `docs/sprints/s1-core-calculator.md` task table + session log updated as work lands.

## Gotchas / lessons

- Build the engine **pure and test-first** — it's the product.
- Don't forget **Σ(quantities)=N filler auto-balance** (Decision 009) and the **game-feel outputs** (Decision 010).
- Next.js will be **newer than training** — read the bundled docs first (`AGENTS.md` rule 5).
- Keep cost/profit numbers OFF the customer odds sheet (market value + odds only).

## Resume prompt for next session

```
MysteryCalc — Phase 0 COMPLETE (proposal SIGNED OFF, Decision 018). Phase 1 (Core Calculator) is cleared to
begin. NO application code exists yet — the Next.js project is not scaffolded.

WHAT MYSTERYCALC IS: a free Next.js web app for VENDORS to design & price mystery games (oripa, mystery boxes,
walls of sleeves, prize wheels, kuji, razzes — the "finite-pool" family). Enter prizes (market value AND cost)
→ pick a game type → set any two of {buy-in price P, # chances N, target margin m} → it solves the third →
shows profit three ways (% / $ / pool-multiple), hit rate, prize-tier breakdown, break-even. Plus a printable
customer odds sheet, and saved/reusable games. Stack: Next.js + TS + Tailwind/shadcn + Supabase + Vercel
(mirrors PokeHolder). Scope + all decisions locked: docs/DECISIONS_LOG.md (001–018).

CORE MATH (docs/modules/calculation-engine.md): V=pool market value, C=pool cost, N=#chances, P=buy-in.
R=N×P, margin m=1−V/(N×P), profit=R−C, solve for any one of {N,P,m}. CRITICAL: in every-chance-wins games
Σ(prize quantities)=N → vendor defines FILLER, tool auto-balances (D-009). Razz = special case (1 prize, N
chances). Outputs go beyond margin: hit rate (% chances ≥ P), prize-tier buckets, volatility, break-even
(ceil(C/P)) (D-010, D-014). Typical game size ~10–500 chances (D-015) → input UX needs strong bulk-filler.

THIS SESSION = Phase 1 / Sprint 1 (Core Calculator), per docs/sprints/s1-core-calculator.md:
1) Scaffold Next.js (App Router) + TS — LATEST Next.js, NEWER THAN TRAINING; read node_modules/next/dist/docs/
   before app code. Add Tailwind + shadcn/ui, ESLint, typecheck, Vitest.
2) Build the PURE calc engine in lib/ FIRST, WITH TESTS (engine before UI). Worked example must reproduce
   exactly: 1 slab $600 + 4 ETB $50 + 95 filler $4 = V $1,180, N 100, P $20 → margin 41%; 35% at $20 → ~91.
3) Then the UI: prize-pool input (bulk filler), game-type picker, solver panel (fix two → show third), results
   dashboard. Keep cost/profit OFF the customer odds sheet.

READ AT SESSION OPEN: docs/CLAUDE.md, docs/CURRENT_PHASE.md, docs/PROPOSAL.md (signed off),
docs/sprints/s1-core-calculator.md, docs/modules/calculation-engine.md (+ prize-pool, game-types as needed).
Follow AGENTS.md (esp. the code-comment standard for technical + semi-non-technical readers; append-only doc
discipline; stay in-phase).

AT SESSION CLOSE: follow docs/session-end-prompt.md line by line; rewrite this file; append to the handoff
(roll to _02 if >15KB); end with the verbatim resume prompt.
```

---

*This file is REWRITTEN (not appended) at the end of every session.*
