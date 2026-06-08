# Current: Live Game Board — ✅ COMPLETE & OWNER-VERIFIED LIVE.

> Updated: 2026-06-08 (end of Session 10)
> Status: **MysteryCalc is LIVE at https://mysterycalc.vercel.app** (Vercel Hobby/free) — all 5 phases shipped,
> plus the post-launch Sprint 6 UX overhaul and **Sprint 7 — the Live Game Board** (customer-facing iPad
> scoreboard, controlled from the vendor's phone, real-time via Supabase). As of Session 10 the board is
> **owner-verified live on real devices**, not just plumbing-verified.
> Active handoff: **`docs/handoff/MASTER_HANDOFF_03.md`** (Sessions 8–10, ~9KB).
> Anchoring docs: `docs/CLAUDE.md`, `docs/sprints/s7-live-board.md`, `docs/modules/live-board.md`,
> `docs/DECISIONS_LOG.md` (001–039).

---

## What MysteryCalc is (one paragraph)

A free web app for **vendors** to **design and price mystery games** (oripa, mystery boxes, walls of sleeves,
prize wheels, kuji, razzes — the finite-pool family). Enter prizes (market value AND your cost), pick a game
type, set any two of {buy-in price, number of chances, **profit goal**}, and it solves the third — then shows
profit three ways, hit rate, prize-tier breakdown, break-even. Log in to save games, print a customer odds
sheet, look up a card/sealed product's market value, and **run the game live** as a customer-facing iPad
scoreboard. Stack: Next.js 16 + Supabase + Vercel. **Live.**

## What happened this session (Session 10)

**Owner live walk-through of the Live Game Board — the one open Sprint-7 item, now closed.** No code written;
this was verification + clean shutdown.
- **Real-device test against prod:** the owner's **phone as the controller** + the **Mac mini's monitor as the
  customer display** (a browser window standing in for the iPad — identical role). Built a game on the phone →
  "Start live board" → entered the pairing code on the monitor → marked wins on the phone.
- **Result:** the full real-time loop (phone → Supabase → big screen) updated within ~a second, no refresh —
  **"works really well"** (owner). No UX rough edges surfaced on either screen.
- **De-risk first:** a fresh anon-key RPC round-trip against prod Supabase confirmed the live path before the
  owner started — create returns code + token; public read leaks no token/hash; secrets table → 401; wrong
  token → 400; right token → 204 + persisted; end → 204; throwaway board cleaned up.

## In progress / next

- **Nothing required.** Sprint 7 is done and owner-verified live. No forced next task.
- **Optional future polish (not committed, no decision yet):** board auto-expiry/cleanup cron; a "my live
  boards" list on the controller; richer razz (single-winner) semantics; an explicit realtime catch-up read on
  first subscribe (today it relies on the whole-state self-heal).

## Blockers
- **None.**

## Gotchas / lessons (carry forward)
- **NEW (S10):** `live_games_game_type_chk` only accepts the engine's exact `GameType` strings —
  `oripa`/`mysteryBox`/`wallOfSleeves`/`slabLot`/`prizeWheel`/`kuji`/`razz`. A casual `"wall"` is rejected with
  a check-constraint error. The app always sends the right value; this only bites manual RPC pokes.
- **Never expose the control token** — `localStorage`-only on the controller phone; the DB stores only its
  SHA-256 hash in the locked `live_game_secrets` table (NOT published to Realtime). Public read leaks nothing
  (re-verified S10: secrets table → 401).
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
launch phases shipped; Sprint 6 added a post-launch UX overhaul (design system + dark mode, /guide, profit-goal
%/$/× units, search relevance); Sprint 7 shipped the LIVE GAME BOARD — a customer-facing iPad scoreboard
controlled from the vendor's phone, real-time via Supabase. As of Session 10 the board is OWNER-VERIFIED LIVE
on real devices (phone controller + Mac-mini monitor display — "works really well"). Stack: Next.js 16 + TS +
Tailwind v4 + shadcn (base-ui) + Supabase + Vercel + qrcode.react. Pre-flight all green as of S9: typecheck /
lint / 88 tests / build. Repo: github.com/mcoski8/mysterycalc.

READ FIRST: docs/CLAUDE.md, docs/CURRENT_PHASE.md, docs/sprints/SPRINT_INDEX.md, and docs/modules/live-board.md.

STATE OF THE LIVE GAME BOARD (Sprint 7, COMPLETE + owner-verified live — Decisions 038–039): data layer
(Session 8) + full app (Session 9) + owner live walk-through (Session 10). Don't rebuild it.
- Pure logic: lib/live-board/{types,state,odds,code,client}.ts (state transitions + live-odds recompute, 18 tests).
- UI: components/live-board/{StartLiveBoard,BoardController,BoardDisplay,JoinBoardForm,WatchQR,AnimatedNumber}.tsx.
- Routes: app/board/page.tsx (join), app/board/[code]/page.tsx (display), app/board/[code]/control/page.tsx.
- Verified: token-checked RPC writes (wrong token rejected), public read leaks no secret, Realtime
  postgres_changes delivers; AND a real owner walk-through (phone control → monitor display) synced within ~1s.

YOUR JOB NEXT SESSION: pick the next piece of work. There is no forced next task. Options:
1) Optional board polish: auto-expiry/cleanup cron, a "my live boards" list on the controller, richer razz
   (single-winner) semantics, or an explicit realtime catch-up read on first subscribe.
2) A brand-new feature/sprint — log a Decision first if it adds scope (box breaks and buyer-mode remain
   deferred; claw is out).

LANDMINES: never render the control token; recompute odds from the pool (don't trust stored values); keep
state writes WHOLE-STATE (not events — the self-heal depends on it); the secrets table is NOT published; push =
prod deploy, keep main releasable. live_games_game_type_chk only accepts exact GameType strings (oripa /
mysteryBox / wallOfSleeves / slabLot / prizeWheel / kuji / razz). For mobile checks use CDP
Emulation.setDeviceMetricsOverride, not the Chrome --screenshot flag.

SUPABASE: project ref txrlpwvmawwfuuzedfbw. Keys in gitignored .env.local (NEXT_PUBLIC_SUPABASE_URL /
NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY), mirrored in Vercel. CLI linked; supabase db push
applies migrations (init + sealed_products + live_game_board all synced).

AT SESSION CLOSE: follow docs/session-end-prompt.md line by line; update the active sprint file + checklist +
SPRINT_INDEX; append DECISIONS + the next session entry to MASTER_HANDOFF_03.md; rewrite this file; commit +
push to origin/main (Decision 019, pre-authorized — push also redeploys prod); end with the verbatim resume prompt.
```

---

*This file is REWRITTEN (not appended) at the end of every session.*
