# Sprint 0 — Foundation (docs + scope)

> **Phase:** 0 (Planning & Documentation)
> **Status:** ✅ COMPLETE (2026-06-05) — documentation done and `docs/PROPOSAL.md` signed off by the owner. Phase 0 exit gate met.
> **Goal:** Define the product, lock scope and the economic model, and stand up the full documentation
> system (mirroring PokeSentry / PokeHolder) so every future session starts with full context.

---

## Scope of this sprint

This sprint produces **no application code**. It produces the shared understanding and the documentation
skeleton the rest of the project runs on. Exit = the owner signs off on the proposal.

## Task table

| # | Task | Status |
|---|------|--------|
| 1 | Create `mysterycalc/` repo folder | Done |
| 2 | Research JP vs US mystery games (Gemini-converged) | Done |
| 3 | Lock product definition with owner (Q&A) | Done |
| 4 | Validate economic model with Gemini | Done |
| 5 | `PROCESS.md` (doc-system explainer) | Done |
| 6 | `docs/PROPOSAL.md` (sign-off gate) | Done |
| 7 | Root `CLAUDE.md` + `AGENTS.md` | Done |
| 8 | `docs/CLAUDE.md` (master context) | Done |
| 9 | `docs/DECISIONS_LOG.md` (001–013) | Done |
| 10 | `docs/CURRENT_PHASE.md` | Done |
| 11 | `docs/checklist.md` | Done |
| 12 | `docs/session-end-prompt.md` | Done |
| 13 | `docs/sprints/` (index + s0 + s1) | Done |
| 14 | `docs/handoff/MASTER_HANDOFF_01.md` | Done |
| 15 | Module docs (6) | Done |
| 16 | `README.md` + `.gitignore` | Done |
| 17 | `git init` + initial commit | Done |
| 18 | **Owner sign-off on PROPOSAL.md** | **Done** ✅ (exit gate met) |
| 19 | Log sign-off resolutions as Decisions 014–018 | Done |

## Session Log

### Session 1 — 2026-06-05 — Documentation build-out
- Researched the JP/US mystery-game landscape and wrote `docs/research/japanese-vs-american-mystery-games.md`;
  converged it with Gemini over two rounds (Gemini added Live Box Breaks + Prize Wheels; one factual dispute
  — the TPCi graded-slab event-ban date — resolved against live 2026 sources to May 30, 2026).
- Ran a structured Q&A with the owner to lock the product: vendor-first; finite-pool game family; Next.js web
  app (desk-planner, mobile-friendly); track both market value and cost; show the cut three ways; manual value
  entry now (lookup later); include a customer odds sheet; save/reuse games; filler + auto-balance; game-feel
  outputs; neutral tone. → **Decisions 001–013**.
- Validated the economic model with Gemini (formulas correct; Σ(quantities)=N is the central subtlety; biggest
  addition = output the prize-value distribution / hit-rate, not just the mean margin).
- Built the **entire documentation skeleton** (this file included), mirroring PokeSentry/PokeHolder, with the
  owner's explicit requirement that code comments serve both technical and semi-non-technical readers (encoded
  in `AGENTS.md` rule 4 and `docs/CLAUDE.md` § "Code Commenting Standard").
- **Files created:** `PROCESS.md`; `CLAUDE.md`, `AGENTS.md`, `README.md`, `.gitignore` (root); `docs/PROPOSAL.md`,
  `docs/CLAUDE.md`, `docs/DECISIONS_LOG.md`, `docs/CURRENT_PHASE.md`, `docs/checklist.md`,
  `docs/session-end-prompt.md`; `docs/sprints/SPRINT_INDEX.md` + `s0-foundation.md` + `s1-core-calculator.md`;
  `docs/handoff/MASTER_HANDOFF_01.md`; `docs/research/japanese-vs-american-mystery-games.md`; module docs
  (`calculation-engine`, `prize-pool`, `game-types`, `odds-sheet`, `price-sources`, `database-schema`).
- **Open / next:** owner sign-off on the proposal (5 open items in §10), then Phase 1 Sprint 1 (Core Calculator).
- **Gotchas:** keep the engine pure + test-first; don't forget filler auto-balance; Next.js will be newer than
  training (read bundled docs before app code).

### Session 1 (cont.) — 2026-06-05 — Proposal signed off
- Owner reviewed the proposal (via a plain-text summary) and answered the 5 open items → **Decisions 014–018**:
  break-even indicator IN v1; typical game size tens–to–a–few–hundred (~10–500); razz KEPT; "MysteryCalc" is a
  working codename; and **"lock it"** (no proposal changes).
- `docs/PROPOSAL.md` status → **SIGNED OFF**; §10 marked resolved. **Phase 0 COMPLETE; Phase 1 cleared.**
- Updated `DECISIONS_LOG.md` (014–018), `checklist.md`, `SPRINT_INDEX.md` (S0 Complete / S1 Next), and this file.
