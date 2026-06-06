# Module — Customer Odds Sheet

> **Location (built):** route `app/games/[id]/odds/page.tsx` + `components/odds-sheet/OddsSheetView.tsx` +
> pure builder `lib/odds-sheet/build.ts` + `@media print` rules in `app/globals.css`. Entry point: the
> "Customer odds sheet" link per game in `components/calculator/SavedGamesBar.tsx`.
> **Status:** ✅ **Built + owner-verified (2026-06-06, Sprint 3).** Print/PDF first; a public no-login share
> link is deferred to Phase 3+ (Decision 027). The customer-safe boundary (no cost/profit/margin) is enforced
> by `tests/odds-sheet.test.ts` (Decision 028).
> **Related:** `docs/modules/calculation-engine.md` (provides per-prize odds), Decisions 007, 027, 028.

---

## What this module does (plain English)

It turns a finished game setup into a clean, **customer-facing sheet** the vendor can print or share — showing
the prize pool and the odds of winning each prize. This is the Japanese "here's exactly what's in the pool and
your chances" transparency that builds player trust. It's a *presentation* of numbers the engine already
computed — no new math here.

## What it shows

- The **game name** and the **buy-in price**.
- The **total pool value** (market) and the **number of chances**.
- A **prize table**: each prize, its market value, its quantity, and the **odds of pulling it**
  (`quantity ÷ N`, from the engine's `perPrizeOdds`).
- Optionally the **hit rate** ("X% of chances win more than the buy-in") if the vendor wants to advertise it.
- A short **disclaimer** line and optional vendor branding.

## What it deliberately does NOT show

- The vendor's **cost** or **profit**. Those are vendor-only numbers; the customer sheet shows market value
  and odds only. WARNING: never leak cost/margin onto the customer sheet.

## Output formats

- **Print** — a print stylesheet that lays the sheet out cleanly on standard paper.
- **Share** — a shareable link/page (Phase 3+), so a buyer can view the odds before playing.

## Modeling notes

- For **tiered** games (kuji, wheel), present odds **per tier** (tier quantity ÷ N) rather than per identical
  low item, for readability.
- For **kuji "Last One,"** label it "awarded to the final draw" rather than giving it a normal probability.
- For **razz**, the "odds" are simply `1 ÷ N` for the single prize (one winner among N spots) — and the sheet
  should make the single-winner nature explicit, since it's the most gambling-like format.

## Rules

- Pull everything from the engine output; do not recompute odds here.
- Keep vendor-only figures (cost, profit, margin) strictly off the customer sheet.
- Comment for technical + semi-non-technical readers per `docs/CLAUDE.md`.
