# Current: Live Game Board — ✅ COMPLETE (Sprint 7 shipped).

> Updated: 2026-06-07 (end of Session 9)
> Status: **MysteryCalc is LIVE at https://mysterycalc.vercel.app** (Vercel Hobby/free) — all 5 phases shipped,
> plus the post-launch Sprint 6 UX overhaul and now **Sprint 7 — the Live Game Board** (customer-facing iPad
> scoreboard, controlled from the vendor's phone, real-time via Supabase). Built and verified this session; it
> goes live on the next push (prod auto-deploys).
> Active handoff: **`docs/handoff/MASTER_HANDOFF_03.md`** (Sessions 8+, 7.7KB).
> Anchoring docs: `docs/CLAUDE.md`, `docs/sprints/s7-live-board.md`, `docs/modules/live-board.md`,
> `docs/DECISIONS_LOG.md` (001–039).

---

## What MysteryCalc is (one paragraph)

A free web app for **vendors** to **design and price mystery games** (oripa, mystery boxes, walls of sleeves,
prize wheels, kuji, razzes — the finite-pool family). Enter prizes (market value AND your cost), pick a game
type, set any two of {buy-in price, number of chances, **profit goal**}, and it solves the third — then shows
profit three ways, hit rate, prize-tier breakdown, break-even. Log in to save games, print a customer odds
sheet, look up a card/sealed product's market value, and now **run the game live** as a customer-facing iPad
scoreboard. Stack: Next.js 16 + Supabase + Vercel. **Live.**

## What was completed (Session 9)

**Sprint 7 — Live Game Board (✅ COMPLETE, Decisions 038–039):** the full app on top of Session 8's verified
data layer (migration untouched).
- **Pure, tested logic** — `lib/live-board/{types,state,odds,code,client}.ts`. State transitions (markWon /
  undoWon / togglePanel) floor at 0, cap at start quantity, keep filler out of the wins ticker, and cap the
  ticker at 50. Live odds (count-left / per-prize / chase-left) are always **recomputed from remaining** —
  stored odds never trusted.
- **UI** — `components/live-board/`: `StartLiveBoard` (calculator → create board), `BoardController` (phone:
  Mark-won/Undo steppers, "common pulled", panel toggles, 🔴 offline banner, end-board), `BoardDisplay` (iPad:
  realtime, four big panels, animated counts, watch-QR), `JoinBoardForm`, `WatchQR` (qrcode.react), `AnimatedNumber`.
- **Routes** — `app/board/page.tsx`, `app/board/[code]/page.tsx`, `app/board/[code]/control/page.tsx`. Wired
  `StartLiveBoard` into the calculator (shown only when a game is solved).
- **Dependency** — added `qrcode.react@^4.2.0` (MIT, inline SVG, offline) for the watch QR (Decision 039).
- **Tests** — `tests/live-board.test.ts` (18). Suite 70 → 88, all green.

## In progress / next

- **Nothing required.** Sprint 7 is done and the routes ship on the next push. The board is functional and
  verified at the plumbing level.
- **Optional future polish (not committed, no decision yet):** board auto-expiry/cleanup cron; a "my live
  boards" list on the controller; richer razz (single-winner) semantics; an explicit realtime catch-up read on
  first subscribe (today it relies on the whole-state self-heal).

## Blockers
- **None.**

## Gotchas / lessons (carry forward)
- **Never expose the control token** — `localStorage`-only on the controller phone; the DB stores only its
  SHA-256 hash in the locked `live_game_secrets` table (NOT published to Realtime). Public read leaks nothing
  (verified).
- **Whole-state writes are the design** — each tap sends the COMPLETE `current_state`, so reconnect, offline
  re-sync, and missed-event recovery are all trivial. A sub-second gap between `.subscribe()`→SUBSCRIBED and
  the binding going live can drop one update; harmless, because the next event re-syncs. Don't switch to
  event/delta writes.
- **Recompute odds from `initial_pool` + `current_state`** (lib/live-board/odds) — never trust stored odds.
- React 19 `react-hooks/set-state-in-effect` trips on client-only inits (window.origin, navigator.onLine) —
  one-line eslint-disable, same as the `next-themes` mounted flag.
- **Push = prod deploy** (git-connected); keep `main` releasable. Pre-existing `npm audit` items (postcss,
  vitest) are unrelated to this work. **Mobile measurement:** use CDP `Emulation.setDeviceMetricsOverride`, not
  the Chrome `--screenshot` flag. (Earlier gotchas still hold: sealed detection = field-absence; in-memory
  search cache; host-agnostic `<img>`; profit-goal unit isn't persisted; SiteFooter is `no-print`.)

## Resume prompt for next session

```
MysteryCalc is LIVE at https://mysterycalc.vercel.app (Vercel Hobby/free, project
michaels-projects-eace96e9/mysterycalc, GitHub-connected — every push to origin/main auto-deploys prod). All 5
launch phases shipped; then Sprint 6 added a post-launch UX overhaul (design system + dark mode, /guide,
profit-goal %/$/× units, search relevance), and Sprint 7 (just finished) shipped the LIVE GAME BOARD — a
customer-facing iPad scoreboard controlled from the vendor's phone, real-time via Supabase. Stack: Next.js 16 +
TS + Tailwind v4 + shadcn (base-ui) + Supabase + Vercel + qrcode.react. Pre-flight all green: typecheck / lint /
88 tests / build. Repo: github.com/mcoski8/mysterycalc.

READ FIRST: docs/CLAUDE.md, docs/CURRENT_PHASE.md, docs/sprints/SPRINT_INDEX.md, and docs/modules/live-board.md.

STATE OF THE LIVE GAME BOARD (Sprint 7, COMPLETE — Decisions 038–039): data layer (Session 8) + full app
(Session 9), all verified against the remote project. Don't rebuild it.
- Pure logic: lib/live-board/{types,state,odds,code,client}.ts (state transitions + live-odds recompute, 18 tests).
- UI: components/live-board/{StartLiveBoard,BoardController,BoardDisplay,JoinBoardForm,WatchQR,AnimatedNumber}.tsx.
- Routes: app/board/page.tsx (join), app/board/[code]/page.tsx (display), app/board/[code]/control/page.tsx.
- Verified: token-checked RPC writes (wrong token rejected), public read leaks no secret, Realtime
  postgres_changes delivers (INSERT/UPDATE/DELETE, incl. id=eq filter). Control token is localStorage-only,
  never rendered. Odds always recomputed from initial_pool + current_state.

YOUR JOB THIS SESSION: pick the next piece of work. There is no forced next task. Options the owner may choose:
1) Owner-facing live walk-through of the board (phone controller + iPad display) and any UX polish that surfaces.
2) Optional board polish: auto-expiry/cleanup cron, a "my live boards" list, richer razz semantics, or an
   explicit realtime catch-up read on first subscribe.
3) A brand-new feature/sprint — log a Decision first if it adds scope (box breaks and buyer-mode remain
   deferred; claw is out).

LANDMINES: never render the control token; recompute odds from the pool (don't trust stored values); keep
state writes WHOLE-STATE (not events — the self-heal depends on it); the secrets table is NOT published; push =
prod deploy, keep main releasable. For mobile checks use CDP Emulation.setDeviceMetricsOverride, not the Chrome
--screenshot flag.

SUPABASE: project ref txrlpwvmawwfuuzedfbw. Keys in gitignored .env.local (NEXT_PUBLIC_SUPABASE_URL /
NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY), mirrored in Vercel. CLI linked; supabase db push
applies migrations (init + sealed_products + live_game_board all synced).

AT SESSION CLOSE: follow docs/session-end-prompt.md line by line; update the active sprint file + checklist +
SPRINT_INDEX; append DECISIONS + the next session entry to MASTER_HANDOFF_03.md; rewrite this file; commit +
push to origin/main (Decision 019, pre-authorized — push also redeploys prod); end with the verbatim resume prompt.
```

---

*This file is REWRITTEN (not appended) at the end of every session.*
