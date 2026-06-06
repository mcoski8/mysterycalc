# Decisions Log — MysteryCalc

> **Purpose:** Record every non-trivial decision so future sessions don't re-debate settled questions.
> **Format:** Question → Options → Choice → Why.
> **Rule:** Append only. Never edit or delete past entries. To change course, add a NEW decision that
> says "this amends/supersedes Decision NNN," and explain why. Reference decisions by number elsewhere.

---

## Decision 001 — Primary audience
**Date:** 2026-06-05
**Question:** Who is MysteryCalc built for first?
**Options:** Vendor-first | Both vendor + buyer from day one | Player-first
**Choice:** Vendor-first.
**Why:** Matches the owner's stated objective exactly — a tool for the person *running* a mystery game to design and price it. A buyer "should I play / live odds" mode is a possible future addition (the engine math supports it), but v1 surface area, features, and goals are all vendor-facing.

## Decision 002 — v1 game scope (the "finite-pool" family)
**Date:** 2026-06-05
**Question:** Which game formats does v1 support?
**Options:** Finite-pool family only | Add Live Box Breaks | Start narrower (just oripa + wall)
**Choice:** The finite-pool family — oripa, mystery box/pack/bag, wall of sleeves/prize wall, mystery slab lots, prize wheel/Plinko, kuji, and razz.
**Why:** They all run on a single shared math model (V, N, P, margin), so covering all of them is nearly free once the engine exists. Live Box Breaks are **deferred** (prizes are random sealed contents the vendor doesn't control → needs a separate cost-and-pull-value model). Claw/UFO catcher is **out** (per-play programmed payout, no fixed pool). See `docs/research/japanese-vs-american-mystery-games.md`.

## Decision 003 — Platform & stack
**Date:** 2026-06-05
**Question:** What is MysteryCalc built as, and where is it used?
**Options:** Web app (desk-planner, mobile-friendly) | Phone-first app | Spreadsheet/desktop tool
**Choice:** A **Next.js + TypeScript web app**, desk-planner first, mobile-friendly in the browser. Same stack as PokeHolder (Tailwind + shadcn/ui, Supabase, Vercel).
**Why:** Planning a game happens at a desk before an event; a web app serves that and still works on a phone at the table. Reusing the PokeHolder stack reuses hard-won setup (auth, deploy, price-lookup learnings) and keeps the owner on familiar ground.

## Decision 004 — Track both market value and cost
**Date:** 2026-06-05
**Question:** Should prize items carry just market value, or also the vendor's cost?
**Options:** Both market + cost | Market value only
**Choice:** Both. Each item has a **market value** and the vendor's **cost**.
**Why:** They answer different questions. Market value drives the *advertised* pool size and the *player's* odds/EV (what the game looks worth); cost drives the vendor's *true profit* (revenue − total cost). Showing only market value would hide whether a game actually makes money.

## Decision 005 — Show the vendor's "cut" three ways
**Date:** 2026-06-05
**Question:** Which single number should the tool lead with for the vendor's take?
**Options:** Percent kept | Dollars of profit | Pool multiple | All three
**Choice:** All three — % kept (margin), dollars of profit (uses cost), and pool multiple (revenue ÷ pool). User toggles which one leads.
**Why:** Owner explicitly wants all three available ("any of the above would be nice to have"). Different vendors think in different terms, and the same game outcome reads naturally in each.

## Decision 006 — Manual value entry first; price lookup later
**Date:** 2026-06-05
**Question:** Where do prize values come from?
**Options:** Manual now, lookup later | Manual only | Automatic lookup from v1
**Choice:** Manual entry for v1, behind a **pluggable price-source interface** so automatic lookup (pokemontcg.io / TCGPlayer) can drop in later without a rewrite.
**Why:** Manual unblocks a usable calculator immediately; lookup is real engineering (rate limits, matching, caching) better done as its own phase. The interface keeps the door open cheaply. Reuses PokeHolder's `price-engine` experience.

## Decision 007 — Customer-facing odds sheet in v1
**Date:** 2026-06-05
**Question:** Should the tool generate a customer-facing odds sheet, or be calculator-only?
**Options:** Include odds sheet | Calculator-only for now
**Choice:** Include a printable/shareable odds sheet (its own phase, Phase 3).
**Why:** It's the Japanese "remaining cards / here are the odds" transparency edge, it builds player trust, and the engine already computes everything it needs (per-prize odds = quantity ÷ N). High value, low marginal cost.

## Decision 008 — Saved, reusable game setups (needs accounts)
**Date:** 2026-06-05
**Question:** Save/reuse game setups, or a pure on-the-spot calculator?
**Options:** Save & reuse (login + storage) | Calculate on the spot only
**Choice:** Save & reuse — Supabase auth + storage (Phase 2). The core calculator still works with no login (Phase 1).
**Why:** Owner wants to revisit, duplicate, and tweak games across events. Keeping the Phase 1 calculator login-free means the tool is useful before accounts exist; saving is the thing that requires an account.

## Decision 009 — Filler items + auto-balance to N
**Date:** 2026-06-05
**Question:** How are "every chance wins" games kept internally consistent?
**Options:** Make the vendor manually ensure prize count = chances | Tool auto-balances with filler
**Choice:** The tool lets the vendor bulk-add **filler** ("the other 95 sleeves each hold a $4 pack") and **auto-balances** so the total prize count always equals N.
**Why:** In oripa/wall/wheel/kuji/slab-lots every chance yields exactly one prize, so Σ(quantities) must equal N. Forcing the vendor to hand-balance this is error-prone; auto-balancing is the central usability win. (Razz is exempt — 1 prize, N chances.)

## Decision 010 — Output game "feel," not just margin
**Date:** 2026-06-05
**Question:** Is margin enough, or does the tool need to describe the player experience?
**Options:** Margin only | Add hit rate + prize-tier breakdown + volatility
**Choice:** Add **hit rate** (% of chances worth ≥ buy-in), a **prize-tier breakdown** (chase/win/dud buckets), and a simple **volatility** read.
**Why:** Gemini's key design point: two games with identical margins can feel completely different (one $600 chase + 95 duds vs. everything ~$12). That difference is what sells chances and what a vendor is really tuning. This turns a margin calculator into a game-design tool.

## Decision 011 — Sell-through / break-even indicator in v1 (PENDING owner confirm)
**Date:** 2026-06-05
**Question:** Does v1 model the risk of a game not selling out?
**Options:** Include a break-even indicator | Assume full sellout for v1
**Choice:** **Proposed:** include a simple "break even once X of N chances sell" indicator. **Status: pending owner confirmation** (flagged in `docs/PROPOSAL.md` §10 Q1 as cuttable).
**Why:** Revenue assumes sellout, but in a pre-placed-prize game the vendor keeps unsold sleeves and their prizes — real risk hinges on whether the chase sold. A break-even read is cheap insight. Marked pending because it's a slightly larger feature the owner may defer.

## Decision 012 — Neutral, transparency-leaning tone
**Date:** 2026-06-05
**Question:** How does MysteryCalc position itself in a gambling-adjacent space?
**Options:** Neutral game-economics tool | "Maximize what you extract" framing
**Choice:** Neutral **game-economics planning tool**, leaning toward fair/disclosed games (the odds sheet, honest hit-rate). A "not affiliated with Nintendo/TPC" footer disclaimer is the only legal nod. No gambling facilitation, payments, or game-running.
**Why:** The space is sensitive. A neutral, transparency-forward posture is both more defensible and more useful, and the owner agreed.

## Decision 013 — Documentation system mirrors PokeSentry / PokeHolder
**Date:** 2026-06-05
**Question:** What documentation/workflow system does this project use?
**Options:** Invent a new one | Mirror the owner's existing PokeSentry/PokeHolder system
**Choice:** Mirror it exactly — `docs/CLAUDE.md` master context, append-only `DECISIONS_LOG.md`, per-session `handoff/`, `sprints/` with task tables + session logs, `CURRENT_PHASE.md` rewritten each session, and the `session-end-prompt.md` ritual. Plus the `PROPOSAL.md` sign-off gate from PokeHolder.
**Why:** It's proven across 120+ sessions on the owner's other projects, the owner navigates by it, and consistency means every future session starts smoothly. Documented in `PROCESS.md`.
