# Sprint 6 — Post-Launch UX Overhaul

> **Phase:** Post-launch (the product shipped at S5). **Status: ✅ COMPLETE** (Session 8, 2026-06-07).
> **Goal:** Make the launched app genuinely beautiful and usable — a real design system, dark mode, a
> game-types guide, a friendlier profit input, a much better search, and a real mobile layout. All shipped
> to production (`https://mysterycalc.vercel.app`).

---

## Tasks

- [x] **Design system** — replace the default grayscale shadcn theme with a cohesive **violet + gold**
  OKLCH palette (light + dark); fix the self-referential `--font-sans` bug (Geist now applies); add
  **Space Grotesk** display font, aurora background, gradient wordmark/logo-mark/step-badges/lead-tile.
  Files: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `components/calculator/*`. (Decision 035)
- [x] **Game guide page** — `/guide`: a field guide to every JP/US mystery format (oripa, kuji, fukubukuro,
  UFO catcher, mystery box/slab, wall, prize wheel, box breaks, razz) with how-it's-played, where-the-gamble-
  sits, legal notes, the gamble-locus spectrum, JP-vs-US table, and which formats MysteryCalc can price.
  Linked from the header + a game-type info panel under the picker (`lib/games/game-info.ts`).
- [x] **Profit goal in 3 units** — "Target margin" → "Profit goal" with a %/$/× toggle; pure tested
  converter `lib/games/goal.ts`; engine + DB unchanged. (Decision 036)
- [x] **Search overhaul** — raised caps, relevance ranking across singles+sealed, set-name matching.
  `lib/prices/relevance.ts` + the sources + composite. (Decision 037)
- [x] **Dark mode** — `next-themes` (system default, no FOUC); toggle in header + footer. (Decision 035)
- [x] **Mobile responsive pass** — prize-pool editor & per-prize odds table become stacked cards below `sm`;
  fixed a real ≤390px header overflow (CDP-measured); "via TCGPlayer" price attribution; prize-pool empty
  state.

## Pre-flight (all green)
- typecheck ✅ · lint ✅ · **70/70 tests** ✅ (added `goal.test.ts` + `relevance.test.ts`) · build ✅
- Deployed live across several commits; verified in production (`/guide` live, search returns set-matches).

## Session log

### Session 8 — 2026-06-07 — UX overhaul, guide, profit-goal, search, dark mode, mobile
Shipped everything above in working slices, each committed + pushed (auto-deployed). Consulted Gemini
(gemini-2.5-pro via `pal`) on the design assessment, the dark-mode approach, and responsiveness — its
findings drove the mobile card refactor and the `next-themes` choice. Decisions 035–037 logged. Then began
Sprint 7 (Live Game Board) — see `s7-live-board.md`.

**Gotchas surfaced:**
- The `--screenshot` Chrome flag renders at the wrong width; use CDP `Emulation.setDeviceMetricsOverride`
  for accurate mobile measurement (`scrollWidth === clientWidth` at 360/390/414 confirms no overflow).
- React 19 `react-hooks/set-state-in-effect` fires on the canonical next-themes `mounted` flag — silence
  that one line with a comment.
- Saved-game goal unit isn't persisted (no DB column) — reopened games show the goal as a margin %.
