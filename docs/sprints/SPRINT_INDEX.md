# Sprint Index — MysteryCalc

> **Purpose:** Quick overview of all sprints. Read `CURRENT_PHASE.md` for active work context.

---

## Sprint Status

| Sprint | Name | Phase | Status | Started | Completed |
|--------|------|-------|--------|---------|-----------|
| S0 | Foundation (docs + scope) | Phase 0: Planning & Docs | **Complete** (proposal signed off) | 2026-06-05 | 2026-06-05 |
| S1 | Core Calculator | Phase 1: Core Calculator (MVP) | **Complete** (engine + UI; exit gate met) | 2026-06-05 | 2026-06-05 |
| S2 | Save & Reuse | Phase 2: Persistence | **Complete** (built + DB live + RLS verified; owner browser click-through confirmed 2026-06-06) | 2026-06-05 | 2026-06-06 |
| S3 | Customer Odds Sheet | Phase 3: Transparency | **Complete** (print/PDF sheet built + owner-verified; public share link deferred to Phase 3+) | 2026-06-06 | 2026-06-06 |
| S4 | Price Lookup | Phase 4: Price data | **Complete** (singles via pokemontcg.io; card search → market value auto-fills; owner-verified. Sealed via tcgcsv adopted but deferred to its own sprint, Decision 031) | 2026-06-06 | 2026-06-06 |
| S4.5 | Sealed-product pricing (tcgcsv) | Phase 4: Price data | **Complete** (nightly sync/index into Supabase; 1,848 sealed products searchable; composite source; owner-verified. Cron activates at Phase 5 deploy. Decisions 031–032) | 2026-06-06 | 2026-06-06 |
| S5 | Launch | Phase 5: Launch | **Complete** (live at https://mysterycalc.vercel.app — Vercel Hobby/free; accessibility+SEO polish; git auto-deploy; sealed cron activated. Decisions 033–034) | 2026-06-06 | 2026-06-06 |
| S6 | Post-Launch UX Overhaul | Post-launch | **Complete** (design system + dark mode, `/guide` page, profit-goal %/$/× units, search relevance + set-name matching, mobile card layouts. Decisions 035–037) | 2026-06-07 | 2026-06-07 |
| S7 | Live Game Board | New feature (post-launch) | **Complete** (full app: phone controller + iPad realtime display + "scan to watch" QR + 18 pure-logic tests; data layer + RPC token-enforcement + Realtime delivery verified against remote. Decisions 038–039) | 2026-06-07 | 2026-06-07 |

## Phase → Exit Criterion (the gate to advance)

| Phase | Exit criterion |
|-------|----------------|
| 0 — Planning & Docs | Owner signs off on `docs/PROPOSAL.md` |
| 1 — Core Calculator | Vendor can build a pool, fix any two of {price, #chances, margin}, get the third + game-feel outputs, in-browser |
| 2 — Save & Reuse | Log in, save a game, reopen and duplicate it |
| 3 — Odds Sheet | Generate a printable/shareable odds sheet from a saved game |
| 4 — Price Lookup | Search a card → market value auto-fills |
| 5 — Launch | Live at a real domain on Vercel, free |

## Deferred / Future
- Live Box Breaks model (separate math) · Buyer "should I play" mode · (Claw machines: out permanently.)

---

*Sprint detail lives in the per-sprint files (`sN-*.md`). Update this table whenever a sprint or phase status changes.*
