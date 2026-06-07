# Current: Live Game Board — data layer DONE; building the app next.

> Updated: 2026-06-07 (end of Session 8)
> Status: **MysteryCalc is LIVE at https://mysterycalc.vercel.app** (Vercel Hobby/free) — all 5 phases shipped.
> This session: a **post-launch UX overhaul** (Sprint 6 — design system + dark mode, `/guide` page,
> profit-goal %/$/× units, search relevance + set-name matching, mobile card layouts — all live), then
> **kicked off the Live Game Board** (Sprint 7 — the customer-facing iPad scoreboard). **The Supabase
> migration for it is applied + verified; the app code is the next session's work.**
> Active handoff: **`docs/handoff/MASTER_HANDOFF_03.md`** (Sessions 8+).
> Anchoring docs: `docs/CLAUDE.md`, `docs/sprints/s7-live-board.md` (active sprint), `docs/modules/live-board.md`,
> `docs/DECISIONS_LOG.md` (001–038).

---

## What MysteryCalc is (one paragraph)

A free web app for **vendors** to **design and price mystery games** (oripa, mystery boxes, walls of sleeves,
prize wheels, kuji, razzes — the finite-pool family). Enter prizes (market value AND your cost), pick a game
type, set any two of {buy-in price, number of chances, **profit goal**}, and it solves the third — then shows
profit three ways, hit rate, prize-tier breakdown, break-even. Log in to save games, print a customer odds
sheet, and look up a card/sealed product's market value. Stack: Next.js 16 + Supabase + Vercel. **Live.**

## What was completed (Session 8)

**Sprint 6 — Post-Launch UX Overhaul (✅ COMPLETE, all live):**
- **Design system** (Decision 035): cohesive **violet+gold** OKLCH theme (light+dark), Space Grotesk display
  font, aurora glow, gradient wordmark/logo/step-badges/lead-tile; fixed the self-referential `--font-sans`
  bug (Geist now actually applies).
- **`/guide`** field-guide page + a game-type info panel under the picker.
- **Profit goal in 3 units** (Decision 036): %/$/× toggle; pure converter `lib/games/goal.ts`; engine + DB
  unchanged.
- **Search overhaul** (Decision 037): raised caps, relevance ranking across singles+sealed, **set-name
  matching** ("charizard paldean" now finds the Paldean-Fates Charizard).
- **Dark mode** via `next-themes` + **mobile pass** (prize editor + odds table → stacked cards; fixed a real
  ≤390px header overflow; "via TCGPlayer" attribution; empty state).

**Sprint 7 — Live Game Board (data layer DONE, Decision 038):**
- Migration `supabase/migrations/20260607120000_live_game_board.sql` **applied to remote + RLS-verified.**
  Two tables — `live_games` (PUBLIC + realtime, no secret) and `live_game_secrets` (token hash, locked) — and
  token-checked `SECURITY DEFINER` RPCs `create_live_game` / `update_live_game` / `end_live_game`.

## In progress / next (Sprint 7 — build the Live Game Board app)

1. **Controller (phone)** — "Start Live Board" from the calculator → `create_live_game` (store the returned
   control token in `localStorage`); `app/board/[code]/control/page.tsx`: per-prize **–/+** steppers +
   "common pulled" + display-panel toggles + a **"🔴 offline"** banner; each change → `update_live_game`.
2. **Display (iPad)** — `app/board/[code]/page.tsx`: fetch state, subscribe to `postgres_changes`, **re-fetch
   on reconnect**, recompute odds from `lib/engine`; four toggle-driven big-screen panels (🔢 X of N left ·
   🏆 chase left · 📊 live odds · 🎉 recent wins) + a "scan to watch" QR; a code-entry landing so the iPad
   joins by typing the code.
3. **Resilience + tests** — reconnect/replay; keep state-transition helpers pure in `lib/` + tested.

## Blockers
- **None.** App is live; the new table is dormant in production until the UI ships (safe).

## Gotchas / lessons (carry forward)
- **Never expose the control token** — it lives only in the controller phone's `localStorage`; the DB stores
  only its SHA-256 hash in the locked `live_game_secrets` table (NOT published to Realtime).
- **Realtime** needs the table in the `supabase_realtime` publication (done) + a SELECT policy the subscriber
  passes (public read in place). Recompute odds from `initial_pool` + `current_state` — never trust stored odds.
- **Mobile measurement:** the Chrome `--screenshot` flag renders at the wrong width — use CDP
  `Emulation.setDeviceMetricsOverride` (`scrollWidth === clientWidth` = no overflow).
- **`next-themes` `mounted` flag** trips React 19 `react-hooks/set-state-in-effect` — one-line eslint-disable.
- **Push = prod deploy** (git-connected); keep `main` releasable. **Supabase:** CLI linked, `supabase db push`
  applies migrations (init + sealed + live_game_board all synced). Profit-goal unit isn't persisted (no DB
  column) — reopened saved games show the goal as a margin %. (Earlier gotchas still hold: sealed detection =
  field-absence; in-memory search cache; host-agnostic `<img>`; SiteFooter is `no-print`.)

## Resume prompt for next session

```
MysteryCalc is LIVE at https://mysterycalc.vercel.app (Vercel Hobby/free, project
michaels-projects-eace96e9/mysterycalc, GitHub-connected — every push to origin/main auto-deploys prod). All
5 launch phases shipped; then Session 8 added a post-launch UX overhaul (design system + dark mode, /guide
page, profit-goal %/$/× units, search relevance + set-name matching, mobile card layouts) — ALL LIVE. Stack:
Next.js 16 + TS + Tailwind v4 + shadcn (base-ui) + Supabase + Vercel. Pre-flight all green: typecheck / lint /
70 tests / build. Repo: github.com/mcoski8/mysterycalc.

YOUR JOB THIS SESSION: build the LIVE GAME BOARD app (Sprint 7, Decision 038). The DATA LAYER IS ALREADY DONE
AND VERIFIED — do NOT redo it. READ FIRST: docs/CLAUDE.md, docs/sprints/s7-live-board.md, docs/modules/live-board.md,
and DECISIONS_LOG.md 038.

THE FEATURE: a vendor props an iPad facing customers showing the running mystery game live — "X of N left",
chase prizes left, live odds, a recent-wins ticker. The vendor marks wins from their PHONE; the iPad updates
in real time.

SECURITY MODEL (the owner's hard requirement — do not weaken): the PHONE creates and controls the board and
holds the secret control token in localStorage — it is NEVER shown on any screen. The iPad is a READ-ONLY
display joined by a short code (a public "scan to watch" QR is fine — it grants view-only only). A passer-by
must NOT be able to take control by scanning the iPad.

DATA LAYER (already applied to remote + RLS-verified — migration
supabase/migrations/20260607120000_live_game_board.sql):
- Table public.live_games (PUBLIC read + in the supabase_realtime publication, NO secret): id, short_code
  (unique, e.g. "GHK-7QM"), game_type, buy_in, initial_chances, initial_pool jsonb, current_state jsonb,
  display_config jsonb, user_id, created_at, updated_at.
- Table public.live_game_secrets (control_token_hash; RLS on, NO client access at all).
- current_state blob shape: { remaining: { [prizeId]: number }, chancesRemaining: number, recentWins:
  [{ name, ts }] }. Store the WHOLE current state (not events) so reconnect is trivial.
- RPCs (the ONLY write path; SECURITY DEFINER): create_live_game(p_game_type, p_buy_in, p_initial_chances,
  p_initial_pool, p_current_state, p_display_config) -> (short_code, control_token);
  update_live_game(p_short_code, p_token, p_current_state, p_display_config);
  end_live_game(p_short_code, p_token). Call via supabase.rpc(...).

BUILD, IN ORDER (verify each slice):
1) Controller (phone): a "Start Live Board" entry from the calculator that calls create_live_game, stores the
   returned control_token in localStorage, and shows the short code + pairing help. Route
   app/board/[code]/control/page.tsx (client): per-prize –/+ steppers (reversible for mis-taps) + a "common/
   filler pulled" tap + display-panel toggles + an "End board" action; each change -> update_live_game with
   the token. Optimistic UI + a "🔴 offline" banner (navigator.onLine) that keeps tracking locally and
   re-syncs on reconnect.
2) Display (iPad): route app/board/[code]/page.tsx (client) — fetch initial state, subscribe to Supabase
   Realtime postgres_changes on live_games filtered to this row, and RE-FETCH the row on reconnect before
   resuming. Recompute odds CLIENT-SIDE from initial_pool + current_state using the pure lib/engine (useMemo)
   — never trust stored odds. Four big-screen panels driven by display_config: 🔢 big "X of N left", 🏆 chase
   prizes left, 📊 live odds per prize, 🎉 recent-wins ticker. Bold large-screen typography + smooth count/
   odds animations + a "📷 scan to watch" QR (read-only). Add a code-entry landing (e.g. app/board/page.tsx)
   so the iPad joins by typing the short code.
3) Resilience + tests: reconnect/replay hardening; keep the state-transition helpers (decrement, undo,
   recompute remaining/chances) PURE in lib/ and unit-test them (Vitest 3).

LANDMINES: never render the control token anywhere; recompute odds from the pool (don't trust stored values);
Realtime needs the table in the publication (done) + a SELECT policy the subscriber passes (public read in
place); the secrets table is NOT published; pgcrypto funcs resolve via the RPCs' search_path = public,
extensions. Push = prod deploy — keep main releasable. For mobile checks use CDP
Emulation.setDeviceMetricsOverride, not the Chrome --screenshot flag.

SUPABASE: project ref txrlpwvmawwfuuzedfbw. Keys in gitignored .env.local (NEXT_PUBLIC_SUPABASE_URL /
NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY), mirrored in Vercel. CLI linked; supabase db push
applies migrations (init + sealed_products + live_game_board all synced). Supabase JS client already wired:
lib/supabase/{server,client}.ts.

AT SESSION CLOSE: follow docs/session-end-prompt.md line by line; update s7-live-board.md + checklist +
SPRINT_INDEX; append DECISIONS + the Session-9 entry to MASTER_HANDOFF_03.md; rewrite this file; commit + push
to origin/main (Decision 019, pre-authorized — push also redeploys prod); end with the verbatim resume prompt.
```

---

*This file is REWRITTEN (not appended) at the end of every session.*
