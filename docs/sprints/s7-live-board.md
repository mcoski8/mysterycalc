# Sprint 7 — Live Game Board (customer-facing iPad scoreboard)

> **Phase:** New feature (post-launch). **Status: ✅ COMPLETE** — data layer DONE (Session 8, 2026-06-07);
> full app (controller + display + resilience + tests) built & verified (Session 9, 2026-06-07).
> **Decisions 038–039.**
> **Goal:** A vendor props an iPad facing customers showing the running game live (what's left, live odds,
> recent wins). The vendor marks wins from their phone; the iPad updates in real time.

---

## The shape (approved by the owner)

- **Phone = controller, iPad = read-only display.** The phone creates the board and holds the secret
  **control token locally — never shown on any screen** (the owner's hard requirement: a passer-by must not
  be able to take control by scanning the iPad). The iPad joins by a short code (e.g. `GHK-7QM`); a public
  "📷 scan to watch" QR is fine because it grants view-only.
- **Real-time via Supabase `postgres_changes`** — the DB row is the single source of truth, so a reloaded
  iPad / WiFi blip self-heals by re-reading state.
- **Tracking:** per-prize **– / +** steppers (reversible, for mis-taps) + a quick **"common/filler pulled"**
  tap. "Chances left" and live odds recompute from the remaining counts.
- **Display:** all four panels built, vendor **toggles which show** from the phone (synced):
  🔢 big "X of N left" · 🏆 chase prizes left · 📊 live odds per prize · 🎉 recent-wins ticker.

## Tasks

### Step 1 — Foundation (data layer) ✅ DONE this session
- [x] Migration `supabase/migrations/20260607120000_live_game_board.sql` — **applied to remote + verified.**
  - `live_games` (PUBLIC + realtime, no secret) + `live_game_secrets` (token hash, no client access).
  - RLS: public read on `live_games`; all writes blocked → go through token-checked `SECURITY DEFINER` RPCs
    `create_live_game` / `update_live_game` / `end_live_game`.
  - Verified with the anon key: create works; public read exposes no hash; secrets table 401; direct PATCH
    RLS-blocked (buy_in unchanged); update needs the correct token (wrong → 400); end cascades.

### Step 2 — Controller (phone)  ✅ DONE (Session 9)
- [x] "Start Live Board" from the calculator → calls `create_live_game` (returns `{short_code, control_token}`);
  stores the token in `localStorage` (`saveControlToken`); shows the short code + a "scan to watch" QR +
  pairing instructions. `components/live-board/StartLiveBoard.tsx` (shown when a game is solved).
- [x] Route `app/board/[code]/control/page.tsx` → `BoardController.tsx` — per-prize "Mark won" / Undo steppers,
  a dedicated "Common pulled" tap for filler, display-panel toggles, "End board" (confirm). Each change →
  `update_live_game(code, token, current_state, display_config)`.
- [x] **Optimistic UI** (taps apply instantly) + a **"🔴 offline"** banner (`navigator.onLine`); keeps the
  latest whole-state in a ref and re-sends on the `online` event. A "no-token" state for a phone that didn't
  start the board (offers the watch view instead).

### Step 3 — Display (iPad)  ✅ DONE (Session 9)
- [x] Route `app/board/[code]/page.tsx` → `BoardDisplay.tsx` (client) — fetches initial state, subscribes to
  `postgres_changes` (UPDATE + DELETE, filtered to the row), **re-fetches the row on reconnect** before
  resuming. Recomputes odds client-side from `lib/live-board/odds` (`useMemo`) — never trusts stored odds.
- [x] Four big-screen panels (toggle-driven): 🔢 X of N left (hero + progress bar) · 🏆 chase prizes left
  (claimed ones crossed off) · 📊 live odds (1-in-N, value-sorted) · 🎉 recent-wins ticker. Bold dark-stage
  typography + `AnimatedNumber` count tweens + a "📷 scan to watch" QR. Code-entry landing `app/board/page.tsx`
  → `JoinBoardForm.tsx`.

### Step 4 — Resilience + polish + tests  ✅ DONE (Session 9)
- [x] Reconnect/replay hardening: whole-state writes mean any missed event self-heals on the next one; display
  catch-up re-fetch on reconnect; controller flush-on-reconnect. Lost-token = "this phone doesn't control it"
  message. (Board auto-expiry/cleanup cron still deferred.)
- [x] 18 unit tests (`tests/live-board.test.ts`) for the pure helpers (markWon/undoWon floors & caps, filler
  not tickered, live-odds recompute from remaining, code normalization). State logic kept pure in
  `lib/live-board/{state,odds,code}.ts`.

## Data shapes (as built)
- `live_games`: `id, short_code, game_type, buy_in, initial_chances, initial_pool (jsonb), current_state
  (jsonb), display_config (jsonb), user_id, created_at, updated_at`.
- `current_state` blob: `{ remaining: { [prizeId]: qty }, chancesRemaining: number, recentWins: [{name, ts}] }`
  (store the WHOLE current state, not events — makes reconnect trivial).
- RPCs: `create_live_game(p_game_type, p_buy_in, p_initial_chances, p_initial_pool, p_current_state,
  p_display_config) → (short_code, control_token)`; `update_live_game(p_short_code, p_token, p_current_state,
  p_display_config)`; `end_live_game(p_short_code, p_token)`.

## Landmines for next session
- **Realtime needs the table in the `supabase_realtime` publication** (it is) AND RLS must allow the
  subscriber to SELECT (public read policy is in place). The secrets table is deliberately NOT published.
- **Never expose the control token** in any server-rendered HTML or on the display page. It lives only in
  the controller phone's `localStorage` (and the DB stores only its SHA-256 hash).
- **pgcrypto** funcs (`digest`, `gen_random_bytes`) resolve via the functions' `search_path = public,
  extensions`.
- Recompute odds from `initial_pool` + `current_state` (the engine is pure) — don't trust any odds stored
  in the row.
- This is new scope beyond the launched phases — keep `docs/CLAUDE.md` scope note in mind; logged as
  Decision 038.

## Session Log

### Session 9 — 2026-06-07 — Built the full Live Game Board app (Sprint 7 complete)
**Completed (all on top of the Session-8 data layer — migration untouched):**
- **Pure lib (`lib/live-board/`):** `types.ts` (shared shapes), `state.ts` (markWon / undoWon / togglePanel /
  initialState / defaultDisplayConfig — floors at 0, caps at start qty, filler not tickered, ticker capped at 50),
  `odds.ts` (countLeft / liveOdds / chasePrizesLeft / prizesRemaining — all recomputed from remaining, never
  trusted), `code.ts` (normalizeCode / isCompleteCode), `client.ts` (RPC wrappers + localStorage token helpers).
- **Components (`components/live-board/`):** `StartLiveBoard.tsx` (calculator entry point), `BoardController.tsx`
  (phone), `BoardDisplay.tsx` (iPad, realtime), `JoinBoardForm.tsx` (code entry), `WatchQR.tsx` (qrcode.react SVG),
  `AnimatedNumber.tsx` (count tween).
- **Routes:** `app/board/page.tsx` (join landing), `app/board/[code]/page.tsx` (display),
  `app/board/[code]/control/page.tsx` (control). Wired `StartLiveBoard` into `components/calculator/Calculator.tsx`.
- **Dependency added:** `qrcode.react@^4.2.0` (MIT, pure-SVG, offline) — implements Decision 038's "scan to
  watch QR"; logged as Decision 039.
- **Tests:** `tests/live-board.test.ts` (18 tests). Suite 70 → 88, all green.

**Verification (plumbing verified myself, not asked of the owner):**
- Pre-flight: `typecheck` ✅ · `lint` ✅ · `test` 88/88 ✅ · `build` ✅ (routes `/board`, `/board/[code]`,
  `/board/[code]/control` registered).
- Live RPC round-trip against the remote project (anon key): `create_live_game` returns code + 36-char token;
  public read exposes **no token/hash**; `update_live_game` with the right token writes (chancesRemaining 99),
  with a **wrong token is rejected** ("invalid control token"); `end_live_game` deletes the row. Test rows
  cleaned up (0 leftover).
- **Realtime confirmed:** subscribed (anon) and received INSERT / UPDATE / DELETE `postgres_changes`, including
  with the `id=eq.<id>` filter. (Gotcha found: a sub-second gap between `.subscribe()` → SUBSCRIBED and the
  binding being live can drop an update made in that exact window — harmless here because we store the WHOLE
  state, so the next event fully re-syncs the display.)

**Gotchas for next session:**
- React 19 `react-hooks/set-state-in-effect` fires on client-only inits (window.origin, navigator.onLine) —
  suppressed with a one-line eslint-disable, same pattern as the `next-themes` mounted flag.
- The board model fits **every-chance-wins** games cleanly; razz (single-winner) renders but its "remaining"
  semantics are loose — fine for now (the driving use case is the wall of sleeves).
- `display_config.title` and the chosen panels travel in the same row as state, so toggling on the phone
  updates the iPad live.
- Pre-existing `npm audit` items (postcss, vitest) are unrelated to this work; not touched.

### Session 10 — 2026-06-08 — Owner live walk-through (board verified on real devices)
**Goal of the session:** the one open Sprint-7 item — a real, owner-driven walk-through of the board (not just
plumbing verification). No code was written; this was a verification + clean-shutdown session.

**What we did:**
- **Live walk-through against prod** (https://mysterycalc.vercel.app), real-device setup: the owner's **phone
  as the controller** and the **Mac mini's monitor as the customer display** (standing in for the iPad —
  identical role, just a browser window on a big screen). Built a game on the phone → "Start live board" →
  entered the pairing code on the monitor → marked wins on the phone.
- **Result: works really well** (owner's words). The full real-time loop — phone control → Supabase → big-screen
  display — updated within ~a second, no refresh. No UX rough edges surfaced on either the phone controller or
  the big display. **Board is now owner-verified live, not just plumbing-verified.**
- **Pre-flight de-risk before the walk-through:** ran a fresh anon-key RPC round-trip against the *prod* Supabase
  to confirm the live path before sending the owner tapping around: `create_live_game` → code + 36-char token;
  public read leaks no token/hash; **secrets table → 401 permission denied**; update with a **wrong token → 400
  "invalid control token"**, with the right token → 204 + state persisted; `end_live_game` → 204. Throwaway test
  board cleaned up (0 leftover rows). Confirmed `/board` serves 200 in prod.

**Gotcha worth keeping:** the `live_games_game_type_chk` constraint only accepts the engine's exact `GameType`
strings — `oripa`, `mysteryBox`, `wallOfSleeves`, `slabLot`, `prizeWheel`, `kuji`, `razz`. A casual `"wall"`
is rejected with a check-constraint error. (The app always passes the correct value; this only bites manual
RPC pokes.)

**Open / next:** unchanged — Sprint 7 is done and verified. Optional future polish remains un-started (board
auto-expiry/cleanup cron, a "my live boards" list, richer razz single-winner semantics, an explicit
first-subscribe catch-up read).
