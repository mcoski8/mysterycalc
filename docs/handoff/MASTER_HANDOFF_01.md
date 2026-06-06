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
