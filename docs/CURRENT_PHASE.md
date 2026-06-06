# Current: Phase 0 — Planning & Documentation. **Awaiting owner sign-off on `docs/PROPOSAL.md`.**

> Updated: 2026-06-05 (initial documentation build-out session)
> Status: **Phase 0 (Planning & Docs).** Full documentation skeleton created. Product/scope locked with the
> owner across a Q&A round (see DECISIONS_LOG 001–013). **No application code yet — and none until the
> proposal is signed off.**
> Active handoff: **`docs/handoff/MASTER_HANDOFF_01.md`**
> Anchoring docs: `docs/PROPOSAL.md` (sign-off gate), `docs/CLAUDE.md` (master context),
> `docs/research/japanese-vs-american-mystery-games.md` (background research).

---

## What MysteryCalc is (one paragraph)

A free web app for **vendors** to **design and price mystery games** (oripa, mystery boxes, walls of
sleeves, prize wheels, kuji, razzes). Enter the prizes you're putting up (with market value AND your cost),
pick a game type, set any two of {buy-in price, number of chances, target margin}, and it solves the third
— then shows your profit three ways, the hit rate, the prize-tier breakdown, and the break-even point, and
can print a customer odds sheet. Built on Next.js + Supabase + Vercel (same stack as PokeHolder).

## What was completed this session

- **Research deliverable:** `docs/research/japanese-vs-american-mystery-games.md` — the JP vs US mystery-game
  taxonomy, converged with Gemini (two rounds).
- **Product definition:** locked the audience, scope, platform, money model, outputs, and tone with the owner
  via a structured Q&A → **Decisions 001–013** in `DECISIONS_LOG.md`.
- **Economic model:** validated with Gemini (V, N, P, margin; solve-for-anything; the Σ(quantities)=N
  "every-chance-wins" rule; market-vs-cost; hit-rate / tier / volatility; sell-through). Captured in
  `docs/PROPOSAL.md` §5 and `docs/modules/calculation-engine.md`.
- **Full documentation skeleton** created (this session): root `CLAUDE.md`+`AGENTS.md`, `README.md`,
  `.gitignore`, `docs/CLAUDE.md`, `docs/PROPOSAL.md`, `docs/DECISIONS_LOG.md`, `docs/checklist.md`,
  `docs/session-end-prompt.md`, `docs/sprints/SPRINT_INDEX.md` + `s0-foundation.md` + `s1-core-calculator.md`,
  `docs/handoff/MASTER_HANDOFF_01.md`, and module docs (`calculation-engine`, `prize-pool`, `game-types`,
  `odds-sheet`, `price-sources`, `database-schema`). Plus the process explainer `PROCESS.md` (repo root).

## In progress

- Nothing actively coding. Phase 0 is a documentation/sign-off phase.

## Not started yet

- All application code (Phase 1 onward). `lib/`, `app/`, `components/`, `supabase/`, `tests/` do not exist.
- The Next.js project itself has not been scaffolded.

## Blockers / open items (need owner input)

These are the open questions from `docs/PROPOSAL.md` §10:
1. **Sell-through indicator** (Decision 011) — keep in v1 or defer?
2. **Typical game size** — tens / hundreds / ~1,000 chances? (affects input UX + performance)
3. **Razz** — keep in v1 or drop given US legal sensitivity?
4. **Public name** — "MysteryCalc" final, or working codename?
5. **Any §1–§9 changes** before the proposal is treated as signed off.

## Immediate next actions (next session)

1. **Get owner sign-off** on `docs/PROPOSAL.md` (resolve the 5 open items above). Log the resolutions as new
   decisions (014+) — do not edit existing ones.
2. On sign-off → **Phase 1, Sprint 1 (Core Calculator):** scaffold the Next.js + TS app, then build the pure
   calculation engine in `lib/` first (with tests), per `docs/sprints/s1-core-calculator.md` and
   `docs/modules/calculation-engine.md`. Engine before UI.
3. Mark Phase 0 complete in `SPRINT_INDEX.md` + `checklist.md` once signed off.

## Gotchas / lessons (this session)

- The big modeling subtlety is **Σ(quantities) = N** for every-chance-wins games → filler + auto-balance
  (Decision 009). Don't build the engine without it.
- Margin ≠ the whole story; build the **hit-rate / tier / volatility** outputs from the start (Decision 010).
- Next.js will be the **latest version, newer than training** — read bundled docs before app code (`AGENTS.md`).

## Resume prompt for next session

```
MysteryCalc — Phase 0 (Planning & Docs). Full documentation skeleton is built; product + scope locked with
the owner (Decisions 001–013 in docs/DECISIONS_LOG.md). NO application code yet, and none until the proposal
is signed off.

WHAT MYSTERYCALC IS: a free Next.js web app for VENDORS to design & price mystery games (oripa, mystery
boxes, walls of sleeves, prize wheels, kuji, razzes — the "finite-pool" family). Enter prizes (market value
AND cost) → pick a game type → set any two of {buy-in price, # chances, target margin} → it solves the third
→ shows profit three ways (% / $ / pool-multiple), hit rate, prize-tier breakdown, break-even. Plus a
printable customer odds sheet. Stack: Next.js + TS + Tailwind/shadcn + Supabase + Vercel (mirrors PokeHolder).

CORE MATH: V=pool value, N=#chances, P=buy-in. R=N×P, margin m=1−V/(N×P), solve-for any one. CRITICAL rule:
in every-chance-wins games Σ(prize quantities)=N, so the vendor defines FILLER and the tool auto-balances
(Decision 009). Two values per item: market (advertised pool + player odds) and cost (true profit). Outputs
go beyond margin to hit rate + tier buckets + volatility (Decision 010).

FIRST TASK THIS SESSION: get owner sign-off on docs/PROPOSAL.md by resolving the 5 open items (§10): (1)
sell-through indicator keep/defer, (2) typical game size, (3) razz keep/drop, (4) final public name, (5) any
other proposal changes. Log resolutions as NEW decisions (014+); never edit existing ones. On sign-off →
Phase 1 Sprint 1 (Core Calculator): scaffold Next.js, then build the PURE calc engine in lib/ FIRST with
tests (engine before UI), per docs/sprints/s1-core-calculator.md + docs/modules/calculation-engine.md.

READ AT SESSION OPEN: docs/CLAUDE.md, docs/CURRENT_PHASE.md, docs/PROPOSAL.md, docs/sprints/SPRINT_INDEX.md +
s1-core-calculator.md, docs/modules/calculation-engine.md. Follow AGENTS.md rules (esp. the code-commenting
standard for technical + semi-non-technical readers, and append-only doc discipline).

AT SESSION CLOSE: follow docs/session-end-prompt.md line by line; rewrite this file; append to the handoff;
end with the verbatim resume prompt.
```

---

*This file is REWRITTEN (not appended) at the end of every session.*
