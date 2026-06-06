# MysteryCalc — Product & Technical Proposal

> **Status:** DRAFT — awaiting owner sign-off.
> **Purpose:** Lay out the full product and technical architecture, with rationale, so the owner can push back section by section before any code is written. **Nothing gets built until this document is signed off.** (This is the "sign-off gate" described in `PROCESS.md`, mirroring PokeHolder's `STACK_PROPOSAL.md`.)
> **Date:** 2026-06-05
> **Basis:** The owner's stated objective + the discussion captured below, the converged research in `docs/research/japanese-vs-american-mystery-games.md`, and two design-review rounds with Gemini (gemini-2.5-pro).

---

## 1. Product Summary

**MysteryCalc** is a free web app that helps a **vendor** (card shop, convention seller, online oripa runner) **design and price a mystery game**. The vendor enters the prize inventory they're willing to give away, and the tool tells them how to structure the game — the buy-in price, the number of chances, and the resulting profit — so the game is sensible, profitable, and transparent.

It answers the vendor's core questions:
> *"I'm putting up these prizes. What should the entry price be? How many sleeves/chances should there be? How much do I actually make? And what does the player experience feel like?"*

It is **not** a buyer's "should I play this" tool (that's a possible future mode), not a marketplace, and not a price tracker.

## 2. The Use Case That Drives Every Decision

> "I'm setting up a wall-of-sleeves game at a convention. I'm putting up one PSA 10 chase worth ~$600, four ETBs, and a big stack of common packs as filler. I want the tool to tell me: if I sell 100 sleeves, what should each cost to keep ~35%? What's my real profit after what I paid for the prizes? How often does a player 'win' more than they paid? And can I print a clean odds sheet to show customers it's fair?"

Every feature is measured against that sentence.

## 3. The Two Distinguishing Features (the moat)

1. **Solve-for-anything pricing.** Give the tool any two of {buy-in price, number of chances, target margin} and it computes the third — plus your true profit. No spreadsheet, no guesswork.
2. **Game *feel*, not just margin.** It shows the player experience: the **hit rate** (how often a player wins more than the buy-in) and the **prize-tier breakdown** (chases vs. wins vs. duds) — because two games with identical margins can feel completely different, and that difference is what sells chances.

A close third: the **customer-facing odds sheet** — the Japanese "here's exactly what's in the pool and your odds" transparency, which builds player trust.

## 4. Scope (locked with the owner)

**In scope for v1 — the "finite-pool" game family** (all share one math model):
- **Oripa** (custom mystery packs)
- **Mystery box / pack / bag** (with an odds table)
- **Wall of sleeves / prize wall** (pick-a-sleeve)
- **Mystery slab lots** (batch of opaque graded cards)
- **Prize wheel / Plinko** (tiered spin)
- **Kuji** (tiered, every ticket wins)
- **Razz / raffle** (the single-winner special case)

**Deferred (not v1):**
- **Live Box Breaks** — prizes are the *random contents of sealed product the vendor doesn't control*, so the economics run on the **cost** of the sealed product and the **expected pull-value distribution** of the set, not a listed prize pool. This needs a separate model; revisit after v1.

**Out of scope (permanently, unless a new decision says otherwise):**
- **Claw / UFO catcher** — per-play programmed payout, no fixed pool of chances. Doesn't fit this tool.

See the full taxonomy and "where the gamble sits" analysis in `docs/research/japanese-vs-american-mystery-games.md`.

## 5. The Economic Model (the spine of the whole app)

This is the math every feature is built on. It was validated with Gemini.

**The three variables:**
- **V** = total prize-pool value = the sum of every item's value × its quantity
- **N** = number of chances (sleeves / tickets / spins / packs)
- **P** = buy-in price per chance

**The relationships:**
- Revenue at full sellout: **R = N × P**
- Your gross profit (vs. market value): **R − V**
- **Margin** (the % you keep): **m = 1 − V / (N × P)**
- A player's average value per chance: **V / N**

**Solve-for-anything** — give any two, get the third:
- Number of chances: **N = V / (P × (1 − m))**
- Buy-in price: **P = V / (N × (1 − m))**
- Margin: **m = 1 − V / (N × P)**

**The critical structural rule** (the central subtlety, confirmed with Gemini): in "every-chance-wins" games (oripa, wall, wheel, kuji, slab lots), **the number of prizes must equal the number of chances** — every chance yields exactly one prize. So the sum of all item quantities must equal N. This forces the vendor to define **filler** (e.g. "the other 95 sleeves each hold a $4 common pack"), and the tool **auto-balances** filler so the prize count always equals N. The **razz** is the one exception: 1 prize, N chances, one winner — the same margin formula still applies.

**Worked example** (the one the owner will recognize):
> Pool: 1 slab ($600) + 4 ETBs ($50 each) + 95 filler packs ($4 each) → **V = $1,180** across **N = 100** sleeves. At a **$20** buy-in: revenue $2,000, **margin 41%**, average player gets $11.80 back per $20. If the vendor wanted 35% at $20, the tool says: drop to **~91 sleeves**.

### 5.1 Two values per item: market vs. cost
Every prize item carries **two** numbers:
- **Market value** — drives the *advertised* pool size and the *player's* odds/EV (what the game looks worth).
- **Your cost** — what the vendor actually paid; drives **true profit** (revenue − total cost).

The tool shows margin against market value (the headline "house edge") **and** real profit against cost (the number that pays the bills). Both matter; they're different.

### 5.2 The three ways to read your cut (owner wants all three)
The same outcome, shown three ways — the vendor toggles whichever they think in:
- **Percent kept** (e.g. "I keep 35%") — house margin.
- **Dollars of profit** (e.g. "I clear $800") — absolute profit (uses cost basis).
- **Pool multiple** (e.g. "players pay in 1.5× the pool's worth") — revenue-to-pool ratio.

### 5.3 Beyond the average — the game's *feel* (Gemini's key addition)
The average tells you margin; it does **not** tell you whether the game is exciting or boring. So the tool also computes:
- **Hit rate** — % of chances that return market value ≥ the buy-in (the headline marketing number).
- **Prize-tier breakdown** — how many prizes fall into buckets like *Chase (>5× buy-in)*, *Win (1–5×)*, *Dud (<1×)*.
- **Volatility** — a simple high/medium/low read on how swingy the prize curve is (standard deviation of prize value under the hood).

### 5.4 Sell-through risk (proposed for v1)
Revenue assumes the game **sells out**. In a pre-placed-prize game, if it doesn't, the vendor keeps the unsold sleeves *and* their prizes — so the real outcome swings on whether the chase sold. The tool will show a simple **break-even indicator**: "you break even once **X** of the **N** chances sell." *(Flagged to the owner as a slightly larger feature that can be cut from v1 if desired.)*

## 6. Technical Architecture

**Stack** (deliberately mirrors PokeHolder so we reuse hard-won setup):
- **Next.js (App Router) + TypeScript** — the web app.
- **Tailwind CSS + shadcn/ui** — fast, clean UI.
- **Supabase (Postgres + Auth)** — login + saving/reusing game setups (Phase 2).
- **Vercel** — hosting + deploy.
- **Price lookup (later):** pokemontcg.io / TCGPlayer, reusing PokeHolder's `price-engine` learnings. Built behind a **pluggable interface** so manual-entry works now and lookup drops in later without a rewrite.

**Pillars:**
- **The calculation engine is pure, framework-free TypeScript** in `lib/` — no React, no DB. It takes inputs and returns numbers. This makes it trivially testable and reusable (web now, anything later). *This is the heart of the product and gets the most tests and the clearest comments.*
- **Manual entry first.** Values are typed in for v1; price lookup is a later phase behind the same interface.
- **Stateless until you save.** The calculator works with zero login. Saving a game is what requires an account (Phase 2).
- **The odds sheet is a derived view** of a game — generated from the same engine output, formatted for printing/sharing.

**Repository layout** (created as phases land — not all upfront):
```
mysterycalc/
  CLAUDE.md            ← pointer → AGENTS.md (Claude Code auto-loads)
  AGENTS.md            ← always-on agent rules (Next.js version, comment standard)
  README.md
  .gitignore
  docs/                ← all planning + handoff docs
  lib/                 ← pure TS: the calculation engine, game-type models, price-source interface, types
  app/                 ← Next.js app (UI), created in the Core Calculator phase
  components/          ← shared UI (shadcn)
  supabase/            ← migrations + schema (Phase 2)
  scripts/             ← helpers
  tests/               ← engine tests (mirrors lib/)
```

## 7. Phased Plan (each phase has an exit criterion — we don't skip ahead)

- **Phase 0 — Planning & Docs (current).** This proposal + the full doc skeleton. **Exit:** owner signs off on this proposal.
- **Phase 1 — Core Calculator (MVP).** The pure calculation engine + prize-pool input UI + solve-for-anything + all outputs (margin three ways, hit rate, tier breakdown, sell-through), for the finite-pool family, manual entry, no login. **Exit:** a vendor can build a pool, set any two of {price, #chances, margin}, and get the third plus the game-feel outputs, entirely in the browser.
- **Phase 2 — Save & Reuse.** Supabase auth + storage; save, reopen, duplicate game setups. **Exit:** log in, save a game, reopen and duplicate it.
- **Phase 3 — Customer Odds Sheet.** Printable/shareable transparency sheet generated from a game. **Exit:** generate a clean odds sheet from a saved game and print/share it.
- **Phase 4 — Price Lookup.** Auto-fill item values from a price source behind the existing interface. **Exit:** search a card and have its market value auto-filled.
- **Phase 5 — Launch.** Polish, deploy to Vercel, custom domain. **Exit:** live at a real URL, free to use.
- **Future / deferred:** Live Box Breaks model; a buyer-facing "should I play / live odds" mode.

## 8. Tone & Positioning (gambling-adjacency)

This is a gambling-adjacent space. MysteryCalc positions as a **neutral game-economics planning tool** — like a margin calculator for a retailer. It does **not** coach "how to squeeze players"; its transparency features (odds sheet, honest hit-rate) actively push toward *fair, disclosed* games. A short "not affiliated with Nintendo/The Pokémon Company" disclaimer is the only legal nod in the UI. No gambling facilitation, no payment processing, no running of games — it only does math and produces planning artifacts.

## 9. Definition of "v1 done"

A vendor can: open the app → add prize items (with market value and cost, including bulk filler) → pick a game type → set any two of {buy-in, #chances, target margin} → instantly see the third, their profit (three ways), the hit rate, the prize-tier breakdown, and the break-even point → and generate a printable customer odds sheet. Saved to their account. Deployed free at a real domain.

## 10. Open Questions for the Owner (please react section-by-section)

1. **Sell-through risk (§5.4)** — keep the break-even indicator in v1, or defer it?
2. **Typical game size** — roughly how many prizes/chances in your games (tens? hundreds? ~1,000 sleeves)? Affects input UX (bulk tools, performance).
3. **Razz inclusion** — keep razz in v1 (it's nearly free given the shared formula), or leave it out given its legal sensitivity in the US?
4. **Domain/name** — is "MysteryCalc" the public name, or a working codename? (Repo stays `mysterycalc` either way.)
5. **Anything in §1–§9 you'd change** before I treat this as signed off.

---

*This document is the sign-off gate. Once approved, the file-structure and decisions here become the authoritative `docs/CLAUDE.md` + `DECISIONS_LOG.md`. Co-designed with Gemini (gemini-2.5-pro) on 2026-06-05.*
