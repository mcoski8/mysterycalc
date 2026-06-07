# Module — Live Game Board

> **Status:** ✅ Complete — data layer (Session 8) + full app (Session 9), verified end-to-end.
> **Decisions 038–039.**

## What it is
A customer-facing iPad "scoreboard" for a running mystery game. The vendor's **phone** controls it (marks
wins); the **iPad** is a read-only live display. They stay in sync through Supabase Realtime.

## Security model (the important part)
A passer-by must not be able to take control by scanning the iPad. So:
- The **phone** creates the board and is the only device that holds the **control token** (kept in
  `localStorage`, never rendered anywhere).
- The DB stores only the token's **SHA-256 hash**, in a **separate, locked-down table** (`live_game_secrets`)
  that no client role can read — *separate* because Supabase Realtime broadcasts a table's rows, so the secret
  can't live as a hidden column on the public board.
- The iPad joins a board by its short code and gets **view-only** data. A public "scan to watch" QR is safe.

## Data layer (migration `20260607120000_live_game_board.sql`, applied to remote)

**Tables**
- `public.live_games` — PUBLIC read + in the `supabase_realtime` publication. No secret. Columns:
  `id, short_code (unique), game_type, buy_in, initial_chances, initial_pool jsonb, current_state jsonb,
  display_config jsonb, user_id, created_at, updated_at`.
- `public.live_game_secrets` — `live_game_id, control_token_hash`. RLS on, **no policies + privileges
  revoked** → no client access at all.

**`current_state` jsonb** (the only thing that changes mid-game; store the WHOLE state, not events):
```
{ remaining: { [prizeId]: number }, chancesRemaining: number, recentWins: [{ name, ts }] }
```

**RPCs (the ONLY write path — `SECURITY DEFINER`, `search_path = public, extensions`)**
- `create_live_game(p_game_type, p_buy_in, p_initial_chances, p_initial_pool, p_current_state,
  p_display_config) → (short_code, control_token)` — server-generates a friendly code (safe alphabet, no
  O/0/I/1, `XXX-XXX`) and a 144-bit token; stores the hash; `user_id` taken from `auth.uid()` (not the client).
- `update_live_game(p_short_code, p_token, p_current_state, p_display_config)` — verifies the token hash, then
  writes state. `p_display_config` is optional (NULL = leave as-is).
- `end_live_game(p_short_code, p_token)` — token-checked delete (cascades to the secret).

**RLS verified (anon key):** create works · public read exposes no hash · secrets table → 401 · direct table
PATCH RLS-blocked (no row changed) · update needs correct token (wrong → 400) · end cascades.

## Client architecture (built — Session 9)
- **Pure logic** in `lib/live-board/`:
  - `types.ts` — `LiveGameRow`, `LiveCurrentState`, `DisplayConfig` (`panels` + optional `title`), `RecentWin`.
  - `state.ts` — `initialState`, `markWon`, `undoWon`, `togglePanel`, `defaultDisplayConfig` (floors at 0, caps
    at start qty, filler stays out of the wins ticker, ticker capped at `MAX_RECENT_WINS = 50`).
  - `odds.ts` — `countLeft`, `liveOdds`, `chasePrizesLeft` (chase = value > 5× buy-in), `prizesRemaining`. All
    recomputed from `initial_pool` + `current_state` — **stored odds are never trusted.**
  - `code.ts` — `normalizeCode` / `isCompleteCode` (tidy "XXX-XXX").
  - `client.ts` (`"use client"`) — RPC wrappers (`createLiveBoard`/`fetchLiveBoard`/`pushLiveState`/
    `endLiveBoard`) + localStorage token helpers (`saveControlToken`/`getControlToken`/`clearControlToken`).
- **Routes:** `app/board/page.tsx` (join landing → `JoinBoardForm`), `app/board/[code]/page.tsx` (display →
  `BoardDisplay`), `app/board/[code]/control/page.tsx` (controller → `BoardController`). Each route is a thin
  async server shell that `await params` and hands the normalized code to the client component.
- **Components** (`components/live-board/`): `StartLiveBoard` (calculator entry, shown when a game is solved),
  `BoardController` (phone), `BoardDisplay` (iPad, realtime), `JoinBoardForm`, `WatchQR` (`qrcode.react` SVG),
  `AnimatedNumber` (count tween).
- **Display** subscribes to `postgres_changes` (UPDATE + DELETE, `filter: id=eq.<id>`); **re-fetches the row on
  reconnect** before resuming; recomputes everything via `lib/live-board/odds` in a `useMemo`.
- **Controller**: optimistic UI (taps apply instantly), `navigator.onLine` "🔴 offline" banner, keeps the
  latest whole-state in a ref and re-sends on the `online` event. Shows a "this phone doesn't control it"
  state when no token is stored (offers the watch view).

## Verified (Session 9, against the remote project)
- typecheck / lint / 88 tests / build all green. 18 unit tests in `tests/live-board.test.ts`.
- RPC round-trip: create returns code + 36-char token; public read exposes **no** token/hash; update needs the
  correct token (wrong → "invalid control token"); end deletes. No leftover rows.
- Realtime `postgres_changes` delivers INSERT/UPDATE/DELETE, including with the `id=eq.<id>` filter.

## Gotchas
- Don't publish or expose the secret anywhere; controller token is `localStorage`-only (never rendered).
- Realtime delivery requires both the publication (set) and a SELECT policy the subscriber passes (public
  read is in place). **A sub-second gap between `.subscribe()`→SUBSCRIBED and the binding going live can drop
  one update** — harmless because we store the WHOLE state, so the next event re-syncs the display. Do NOT
  switch to event/delta writes to "optimize" — that reintroduces replay bugs.
- Keep state writes as whole-state (not events): it's what makes reconnect, offline re-sync, and missed-event
  recovery all trivial.
- React 19 `react-hooks/set-state-in-effect` trips on client-only inits (window.origin, navigator.onLine) —
  one-line eslint-disable (same as the `next-themes` mounted flag).
- Free-tier headroom is huge (2 connections/board vs the 500 limit).
