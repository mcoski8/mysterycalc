# Sprint 7 — Live Game Board (customer-facing iPad scoreboard)

> **Phase:** New feature (post-launch). **Status: 🔨 IN PROGRESS** — data layer DONE (Session 8, 2026-06-07);
> app code is the next session. **Decision 038.**
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

### Step 2 — Controller (phone)  ⬜ NOT STARTED
- [ ] "Start Live Board" from the calculator → call `create_live_game` (returns `{short_code, control_token}`);
  store the token in `localStorage`; show the short code + the pairing instructions.
- [ ] Route `app/board/[code]/control/page.tsx` (client) — per-prize – / + steppers, "common pulled",
  display-panel toggles, "end board". Each change → `update_live_game(code, token, current_state, display_config)`.
- [ ] **Optimistic UI** + a clear **"🔴 offline"** banner (`navigator.onLine`); keep tracking locally and
  re-sync on reconnect.

### Step 3 — Display (iPad)  ⬜ NOT STARTED
- [ ] Route `app/board/[code]/page.tsx` (client) — fetch initial state, subscribe to `postgres_changes`,
  **re-fetch on reconnect** before resuming. Recompute odds client-side from `lib/engine` (`useMemo`).
- [ ] The four big-screen panels (toggle-driven), bold typography, smooth count/odds animations, a
  "scan to watch" QR. A code-entry landing (`app/board/page.tsx`?) so the iPad can join by typing the code.

### Step 4 — Resilience + polish + tests  ⬜ NOT STARTED
- [ ] Reconnect/replay hardening; lost-token recovery note; optional board auto-expiry/cleanup (cron later).
- [ ] Tests for the state-transition helpers (decrement, undo, recompute) — keep that logic pure in `lib/`.

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
