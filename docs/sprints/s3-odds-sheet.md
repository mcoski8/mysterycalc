# Sprint 3 — Customer Odds Sheet

> **Phase:** 3 (Transparency)
> **Status:** ✅ BUILT + owner-verified in the browser (2026-06-06). Print/PDF sheet shipped; public
> share link deferred to Phase 3+ (Decision 027). Exit criterion met.
> **Goal:** Turn any saved game into a clean, **customer-facing** sheet the vendor can print or save as
> PDF — showing the prize pool and the odds of pulling each prize, and **nothing about the vendor's cost,
> profit, or margin.**
> **Exit criterion:** Generate a printable/shareable odds sheet from a saved game.

---

## Scope for this sprint (Decision: print/PDF first — owner chose 2026-06-06)

- **In:** a print-optimized odds sheet rendered from a *saved* game, reached from the "My games" list.
  Print / Save-as-PDF via the browser. An optional editable "shop / event name" header.
- **Out (this sprint):** a public, no-login shareable link (a natural Phase 3+ follow-on — needs a share
  token + a careful public-read path that still hides cost/profit). Not built yet; logged here so it isn't lost.
- **Stays in-phase:** no Phase 4 (price lookup) code.

## The key rule (baked into a test)

The customer sheet shows **market value and odds only**. The vendor's **cost, profit, and margin never
appear.** `tests/odds-sheet.test.ts` asserts the built sheet view-model carries no cost/profit/margin field.

## Design (no new math — it's a presentation of engine output)

- **Pure builder** `lib/odds-sheet/build.ts`: `buildOddsSheet(snapshot, name)` → a serializable view-model
  (`OddsSheet`). It runs the existing `solveGame` and reads `perPrizeOdds` (name, quantity, probability =
  quantity ÷ N), the buy-in, pool value, and hit rate. Per-prize market value is merged in by position from
  the saved items (the engine's odds list is in item order, with a trailing "No prize" line for razz).
- **Pure helper** `snapshotToSolveInput(snapshot)` in `lib/saved-games/serialize.ts`: turns a saved snapshot
  into `{ items, config }` for the engine (the solved-for knob is left out; the other two are passed). Keeps
  the builder and tests from duplicating `Calculator.tsx`'s input-assembly logic.
- **Server action** `loadGameForSheet(id)` in `lib/saved-games/actions.ts`: auth-checked; returns the game's
  `name` + `snapshot` (RLS guarantees it's the caller's game).
- **Route** `app/games/[id]/odds/page.tsx` (Server Component): auth-gate (redirect to `/login`), load, build,
  render. A thrown `EngineError` (e.g. empty pool) renders a friendly message + a link back.
- **UI** `components/odds-sheet/OddsSheetView.tsx` (Client): the printable sheet + an editable optional shop
  name + Print / Back buttons wrapped in `.no-print` so they don't appear on paper.
- **Print stylesheet:** `@media print` rules in `app/globals.css` (hide `.no-print`, white background,
  full-width sheet).
- **Entry point:** an "Odds sheet" link per row in `components/calculator/SavedGamesBar.tsx` → `/games/{id}/odds`.

## Format-specific notes (from `docs/modules/odds-sheet.md`)

- Tiered games (kuji/wheel): the vendor's prize *lines* already are the tiers (they enter "A prize ×3",
  "B prize ×10"), so per-line odds = per-tier odds. No extra tiering needed in v1.
- Razz (single winner): the engine already emits `1 ÷ N` per listed prize plus a "No prize" line; the sheet
  labels the single-winner nature explicitly.
- Kuji "Last One": no data-model field for it yet → not special-cased in v1 (future enhancement).

## Task table

| # | Task | Status |
|---|------|--------|
| 1 | Sprint doc + SPRINT_INDEX status | ✅ Done |
| 2 | `snapshotToSolveInput` pure helper (serialize.ts) | ✅ Done |
| 3 | Pure builder `lib/odds-sheet/build.ts` (`OddsSheet` view-model) | ✅ Done |
| 4 | `loadGameForSheet` server action | ✅ Done |
| 5 | Route `app/games/[id]/odds/page.tsx` (auth-gate + build + error state) | ✅ Done (unauth → /login verified via curl) |
| 6 | `OddsSheetView` client component (sheet + shop name + print/back) | ✅ Done |
| 7 | Print stylesheet in `globals.css` | ✅ Done |
| 8 | "Odds sheet" link in SavedGamesBar rows | ✅ Done |
| 9 | `tests/odds-sheet.test.ts` (odds correct + NO cost/profit leak) | ✅ Done (4 tests) |
| 10 | Pre-flight: typecheck / lint / tests / build | ✅ Done (typecheck ✅, lint ✅, 41/41 tests ✅, build ✅) |
| 11 | Owner browser check (open a saved game's sheet, print preview) | ⏳ Pending owner |

## Acceptance checks

- [ ] From "My games," an "Odds sheet" link opens `/games/{id}/odds` for that game.
- [ ] The sheet shows game name, buy-in, pool value, # chances, and a per-prize table with odds.
- [ ] The sheet shows **no** cost, profit, or margin anywhere (verified by eye + by test).
- [ ] Razz shows the single-winner nature + a "No prize" line.
- [ ] Print preview (Cmd+P) lays out cleanly with the buttons/chrome hidden.
- [ ] A logged-out visitor to `/games/{id}/odds` is sent to `/login`; another user's id yields not-found.

## Session Log

### Session 4 — 2026-06-06 — Phase 3 / Sprint 3 BUILT (print/PDF odds sheet)

**Outcome:** Phase 2's browser click-through was confirmed by the owner at session open (Phase 2 gate fully
closed). Then built the Phase 3 Customer Odds Sheet end-to-end (print/PDF first) and the owner verified it in
the browser, including print preview. Pre-flight all green: typecheck ✅, lint ✅, **41/41 tests ✅** (4 new),
build ✅. The new `/games/[id]/odds` route correctly redirects logged-out visitors to `/login` (curl-verified).

**What was built (files):**
- `lib/odds-sheet/build.ts` — **pure** `buildOddsSheet(snapshot, name)` → `OddsSheet` view-model. Runs the
  existing `solveGame`, reads `perPrizeOdds` + buy-in + pool value + hit rate, merges each prize's market
  value by position. **Builds NO cost/profit/margin field** — the customer-safe boundary lives here.
- `lib/saved-games/serialize.ts` — added pure `snapshotToSolveInput(snapshot)` → `{ items, config }` (the
  solved-for knob left `undefined`), so the builder/tests don't duplicate `Calculator.tsx`'s input assembly.
- `lib/saved-games/actions.ts` — added auth-checked `loadGameForSheet(id)` → `{ name, snapshot }` (the sheet
  needs the game's name, which `loadGame` alone doesn't return).
- `app/games/[id]/odds/page.tsx` — Server Component: auth-gate (→ `/login`), load (RLS), build, render;
  EngineError → friendly `Problem` message. (Next 16: `params` is a Promise — awaited.)
- `components/odds-sheet/OddsSheetView.tsx` — Client: the printable sheet + an optional editable shop/event
  name + Print/Back buttons (wrapped in `.no-print`). Odds shown as `%` **and** friendly "1 in N". Razz shows
  the single-winner note.
- `app/globals.css` — `@media print` rules: hide `.no-print`, force black-on-white, drop the card framing.
- `components/calculator/SavedGamesBar.tsx` — added a per-game "Customer odds sheet" link (scroll icon) →
  `/games/{id}/odds`, opens in a new tab.
- `tests/odds-sheet.test.ts` — 4 tests: worked-example odds correct; **NO cost/profit/margin leak** (the hard
  rule); razz single-winner + "No prize" line; solving-for-chances (solved knob blank) path.

**Decisions logged:** D-027 (Phase 3 scope = print/PDF first; public share link deferred to Phase 3+),
D-028 (odds-sheet architecture: pure builder + customer-safe boundary enforced by a test). See `DECISIONS_LOG.md`.

**Gotchas / landmines for next session:**
- **Don't construct JSX inside a `try/catch`** in a Server Component — ESLint (`react-hooks/error-boundaries`)
  errors. Compute into a variable in the `try`, return the JSX after. (Hit + fixed in the odds route.)
- **`perPrizeOdds` carries no market value** — the sheet merges value by position from the saved items; the
  only extra entry is razz's trailing "No prize" line (worth $0, no matching item). If the engine ever
  reorders `perPrizeOdds`, this merge must be revisited.
- The **public share link is NOT built** (deferred). When it comes: it needs a share token + a public-read
  path that still hides cost/profit — do NOT just relax RLS on `games`/`prize_items` (those rows contain cost).
- **No vendor-profile / shop-name persistence** — the shop name on the sheet is a transient on-page field, not
  saved. A saved vendor brand is a future enhancement.
