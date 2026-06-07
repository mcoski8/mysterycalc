# Module — Live Game Board

> **Status:** Data layer built + verified (Session 8). App code pending (Sprint 7). **Decision 038.**

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

## Client architecture (Sprint 7, not yet built)
- Routes: `app/board/[code]/page.tsx` (display), `app/board/[code]/control/page.tsx` (phone controller).
- Display subscribes to `postgres_changes` on `live_games`; **re-fetches the row on reconnect** before
  resuming; recomputes odds with the pure `lib/engine` from `initial_pool` + `current_state` (`useMemo`) —
  never trusts stored odds.
- Controller: optimistic UI, `navigator.onLine` "🔴 offline" banner, local tracking + re-sync on reconnect.
- Keep the state-transition logic (decrement / undo / recompute) **pure in `lib/`** so it's unit-tested.

## Gotchas
- Don't publish or expose the secret anywhere; controller token is `localStorage`-only.
- Realtime delivery requires both the publication (set) and a SELECT policy the subscriber passes (public
  read is in place).
- Free-tier headroom is huge (2 connections/board vs the 500 limit).
