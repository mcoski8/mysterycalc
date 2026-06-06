# MysteryCalc — Master Context (CLAUDE.md)

> **Read this first, every session.** This is the single source of truth for what MysteryCalc is,
> how it's built, and the rules of the road. If anything else in the repo contradicts this file,
> this file wins until it's deliberately updated (with a logged decision).
>
> **After this file, read:** `docs/CURRENT_PHASE.md` → the active sprint file in `docs/sprints/` → any
> module docs relevant to the current work.

---

## What MysteryCalc Is

A free web app that helps a **vendor** (card shop, convention seller, online oripa runner) **design and
price a mystery game**. The vendor enters the prize inventory they're willing to give away; the tool
tells them how to structure the game (buy-in price × number of chances), what they actually make, and
what the game feels like to play — and it can print a customer-facing odds sheet.

It is **not** a buyer's tool, a marketplace, a price tracker, or anything that runs/processes a game.
It only does math and produces planning artifacts.

Full rationale, scope, and the phased plan live in `docs/PROPOSAL.md` (the sign-off gate). This file is
the day-to-day working context.

## The Use Case That Drives Every Decision

> "I'm setting up a wall-of-sleeves game. I'm putting up a $600 PSA 10 chase, four ETBs, and a stack of
> common packs as filler. Tell me: at 100 sleeves, what's each cost to keep ~35%? What's my real profit
> after what I paid for the prizes? How often does a player win more than they paid? And can I print a
> fair-looking odds sheet?"

Every feature is measured against that sentence.

## The Two Distinguishing Features (the moat)

1. **Solve-for-anything pricing** — give any two of {buy-in price, number of chances, target margin}, get
   the third, plus true profit.
2. **Game *feel*, not just margin** — hit rate (how often a player wins more than the buy-in) and a
   prize-tier breakdown (chases vs. wins vs. duds), because identical margins can feel totally different.

Close third: the **customer-facing odds sheet** (transparency = trust).

## Scope (locked with the owner — see DECISIONS_LOG)

**In v1 — the "finite-pool" family** (one shared math model): oripa, mystery box/pack/bag, wall of
sleeves/prize wall, mystery slab lots, prize wheel/Plinko, kuji, razz (single-winner special case).

**Deferred:** Live Box Breaks (random sealed contents → needs a separate cost-and-pull-value model).

**Out (permanent unless re-decided):** claw / UFO catcher (no fixed pool of chances).

Background taxonomy: `docs/research/japanese-vs-american-mystery-games.md`.

## The Economic Model (the spine — memorize this)

- **V** = total prize-pool value (Σ item value × quantity)
- **N** = number of chances
- **P** = buy-in price per chance
- Revenue (full sellout): **R = N × P** · Gross profit vs. market: **R − V** · Margin: **m = 1 − V/(N×P)**
- Solve-for: **N = V/(P×(1−m))** · **P = V/(N×(1−m))** · **m = 1 − V/(N×P)**

**Critical rule — "every chance wins":** for oripa/wall/wheel/kuji/slab-lots, the number of prizes must
equal N (every chance = one prize). The vendor defines **filler**, and the tool **auto-balances** so prize
count = N. **Razz** is the exception: 1 prize, N chances, one winner — same margin formula.

**Two values per item:** **market value** (drives advertised pool + player odds) and **cost** (drives true
profit). Show both. **Three readings of the cut:** % kept · dollars of profit · pool multiple — owner wants
all three, toggleable. **Beyond the mean:** hit rate, prize-tier breakdown, volatility. **Sell-through:** a
break-even indicator (proposed for v1). Detail lives in `docs/modules/calculation-engine.md`.

## Tech Stack

- **Next.js (App Router) + TypeScript** — the web app (latest Next.js; see "Next.js version" below).
- **Tailwind CSS + shadcn/ui** — UI.
- **Supabase (Postgres + Auth)** — login + saved games (Phase 2).
- **Vercel** — hosting + deploy.
- **Price lookup (Phase 4):** pokemontcg.io / TCGPlayer, behind a pluggable interface (manual entry now).
- **The calculation engine is pure, framework-free TypeScript** in `lib/` — no React, no DB. Most-tested,
  best-commented part of the codebase.

## Phased Plan (don't skip ahead; each phase has an exit criterion)

- **Phase 0 — Planning & Docs (current).** Exit: owner signs off on `docs/PROPOSAL.md`.
- **Phase 1 — Core Calculator (MVP).** Engine + prize-pool input + solve-for + all outputs, finite-pool
  family, manual entry, no login. Exit: a vendor can build a pool, set any two of {price,#chances,margin},
  get the third + game-feel outputs, in-browser.
- **Phase 2 — Save & Reuse.** Supabase auth + storage. Exit: log in, save, reopen, duplicate a game.
- **Phase 3 — Customer Odds Sheet.** Exit: generate a printable/shareable odds sheet from a saved game.
- **Phase 4 — Price Lookup.** Exit: search a card → market value auto-fills.
- **Phase 5 — Launch.** Exit: live at a real domain on Vercel, free.
- **Future/deferred:** Live Box Breaks model; buyer "should I play / live odds" mode.

## Repository Layout (created as phases land — not all at once)

```
mysterycalc/
  CLAUDE.md            ← pointer → AGENTS.md (auto-loaded by Claude Code)
  AGENTS.md            ← always-on agent rules (short)
  README.md  .gitignore
  PROCESS.md           ← how we work (the doc-system explainer)
  docs/
    CLAUDE.md          ← you are here (master context)
    CURRENT_PHASE.md   ← rewritten every session
    PROPOSAL.md        ← product+tech proposal (sign-off gate)
    DECISIONS_LOG.md   ← append-only numbered decisions
    checklist.md       ← all tasks by phase/sprint
    session-end-prompt.md ← clean-shutdown ritual (static)
    handoff/MASTER_HANDOFF_01.md ← append-only session journal
    sprints/SPRINT_INDEX.md + sN-*.md
    modules/           ← per-component reference (read before touching that area)
    research/          ← background research deliverables
    architecture/      ← big-picture design docs (as needed)
  lib/                 ← pure TS: calc engine, game-type models, price-source interface, types
  app/                 ← Next.js UI (Phase 1)
  components/          ← shared UI (shadcn)
  supabase/            ← migrations + schema (Phase 2)
  tests/               ← engine tests (mirrors lib/)
```

(Public product name: "MysteryCalc". Repo/codename: `mysterycalc`.)

---

## Code Commenting Standard (HARD RULE — the owner asked for this explicitly)

**Goal: a developer AND a semi-non-technical reader can both open any file and understand what's going
on and why.** This is non-negotiable; it's a core reason the owner trusts the codebase.

**Every file/module** opens with a plain-English header block:
- *What this does* (one or two sentences, no jargon).
- *Why it exists* / where it fits.
- *What calls it and what it calls* (its neighbors), when non-obvious.

**Every non-obvious function** gets a one-line plain-English summary directly above it — what it takes,
what it gives back, in words a non-coder could follow.

**Label the math in words.** Never leave a formula as bare symbols. Say what it computes and why.

**Comment the WHY, not the obvious WHAT.** Don't narrate `i = i + 1`. Do explain business logic, the
reason behind a choice, and anything surprising about a game's economics.

**Use trap tags:** `WARNING:` (easy to misuse), `GOTCHA:` (surprising behavior), `FRAGILE:` (breaks
easily / external dependency). `TODO:` must reference a sprint (e.g. `TODO(S1):`).

**Example (the style we want):**
```ts
// ============================================================
// Margin Solver — the heart of MysteryCalc.
// Given a prize pool and any TWO of {buy-in price, number of
// chances, target margin}, it works out the third.
//
// Plain English: a "mystery game" takes in money (chances sold ×
// price) and gives out prizes (the pool). The "margin" is the
// slice the vendor keeps. These three knobs are locked together,
// so fixing any two fixes the third.
// ============================================================

/**
 * Work out the buy-in price needed to hit a target margin.
 * Inputs: pool value V, number of chances N, target margin m (0–1).
 * Returns: the price each chance must cost.
 */
function priceForMargin(poolValue: number, chances: number, margin: number): number {
  // Revenue must equal pool value divided by (1 − margin): if you
  // keep 35% (margin 0.35), the prizes are 65% of the money taken in.
  // So price = poolValue / (chances × (1 − margin)).
  // GOTCHA: margin must be < 1, or you're claiming the prizes are
  // worth $0 — guard against that before calling this.
  return poolValue / (chances * (1 - margin))
}
```

**Don't:** comment every line, restate the code, or leave a formula unexplained.

---

## Do's and Don'ts

**DO**
- Keep the calculation engine pure (no React/DB) and heavily tested — it's the product.
- Show both market value and cost; never conflate "pool looks worth X" with "I profit X."
- Auto-balance filler so prize count = N in every-chance-wins games.
- Lead with whichever cut metric (% / $ / multiple) the user chose, but make all three available.
- Give the owner click-by-click instructions for any manual/terminal/dashboard step.

**DON'T**
- Don't write later-phase code (auth/DB/price-lookup) before its phase gate is met.
- Don't add scope (box breaks, buyer mode, claw) or paid dependencies without a logged decision.
- Don't position the tool as "how to squeeze players" — neutral game-economics framing only.
- Don't edit or delete past decisions/handoff/sprint-log entries — append and supersede.
- Don't commit `.env*` or any secrets.

## Useful Commands (once the app exists — Phase 1+)

```bash
npm install                  # install deps
npm run dev                  # local dev server
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint
npm test                     # engine tests
npm run build                # production build (must pass before deploy)
```

---

*Last updated: 2026-06-06 (Phase 3 / Sprint 3 — Customer Odds Sheet built + owner-verified: a print/PDF
customer-facing odds sheet derived from a saved game, with the cost/profit/margin boundary enforced by a test.
Phase 2 fully Complete — owner browser click-through confirmed. Public odds-sheet share link deferred to
Phase 3+ (Decision 027). Next: Phase 4 — Price Lookup.)*
