-- ============================================================
-- MysteryCalc — Live Game Board schema (new feature, Decision 038).
--
-- Plain English: this powers the "live board" — a vendor props an iPad up
-- facing customers, and it shows the running game (what's left, live odds,
-- recent wins) updating in real time as the vendor taps wins on their phone.
--
-- The security model (what the owner asked for): a passer-by must NOT be able
-- to hijack the board. So we split the data in two:
--   • `live_games`        — PUBLIC + realtime. Holds the board state everyone
--                           may watch. Contains NO secret.
--   • `live_game_secrets` — PRIVATE. Holds only the hashed control token, and
--                           NO client role can read it.
-- The vendor's phone is the only place the real (unhashed) control token ever
-- lives. All writes go through token-checked database functions, so even with
-- the public anon key, nobody can change a board without that secret token.
--
-- Why two tables instead of one hidden column: Supabase Realtime broadcasts a
-- table's rows to subscribers, so the secret must live in a SEPARATE table
-- that is never published and never readable — not just a hidden column.
--
-- See docs/modules/live-board.md and DECISIONS_LOG 038.
-- ============================================================

-- pgcrypto gives us digest() (for hashing the token) and gen_random_bytes()
-- (for making one). On Supabase it lives in the `extensions` schema.
create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------
-- live_games — one row per running board. Public + realtime, no secrets.
--
-- `initial_pool` / `initial_chances` are the game as it STARTED (static).
-- `current_state` is the only thing that changes mid-game — storing the whole
-- current state (not a stream of events) makes reconnect trivial: a reloaded
-- iPad just re-reads this row. `display_config` is which panels the vendor has
-- chosen to show, so toggling them on the phone updates the iPad live too.
-- ------------------------------------------------------------
create table if not exists public.live_games (
  id              uuid primary key default gen_random_uuid(),
  -- Short, human-typeable pairing code shown on the iPad, e.g. "GHK-7QM".
  short_code      text not null unique,
  -- One of the seven finite-pool game types (see lib/games/game-types.ts).
  game_type       text not null,
  buy_in          numeric not null default 0,
  initial_chances integer not null,
  initial_pool    jsonb   not null,   -- the PrizeItem[] at the start
  current_state   jsonb   not null,   -- { remaining: {id:qty}, chancesRemaining, recentWins[] }
  display_config  jsonb   not null default '{}'::jsonb, -- which panels are visible
  -- Optional owner link (set when a logged-in vendor starts it); anonymous
  -- boards leave this NULL. SET NULL so deleting an account orphans, not drops.
  user_id         uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint live_games_game_type_chk
    check (game_type in ('oripa','mysteryBox','wallOfSleeves','slabLot','prizeWheel','kuji','razz'))
);

-- Most-recent boards first, for any future "my boards" listing / cleanup.
create index if not exists live_games_user_updated_idx
  on public.live_games (user_id, updated_at desc);

-- ------------------------------------------------------------
-- live_game_secrets — the control token hash, and nothing else.
-- No client role gets ANY access (no policies + RLS on = deny all). Only the
-- SECURITY DEFINER functions below ever touch it.
-- ------------------------------------------------------------
create table if not exists public.live_game_secrets (
  live_game_id       uuid primary key
                       references public.live_games (id) on delete cascade,
  control_token_hash text not null
);

-- ============================================================
-- Row-Level Security.
-- ============================================================
alter table public.live_games        enable row level security;
alter table public.live_game_secrets enable row level security;

-- Anyone may WATCH a board (that's the whole point — it faces customers).
-- This table carries no secret, so public read is safe.
create policy "live_games public read"
  on public.live_games for select
  using (true);

-- No insert/update/delete policies on live_games, and NO policies at all on
-- live_game_secrets → all writes are denied to clients and must go through the
-- token-checked functions below.

-- Belt-and-suspenders: make sure the anon/authenticated roles can't touch the
-- secrets table directly even if a policy is added by mistake later.
revoke all on public.live_game_secrets from anon, authenticated;

-- Realtime: publish live_games so a subscribed iPad gets push updates. The
-- secrets table is deliberately NOT published.
alter publication supabase_realtime add table public.live_games;

-- ============================================================
-- create_live_game — start a board. Returns the pairing code + the ONE-TIME
-- plaintext control token (the caller's phone stores it locally and never
-- shows it). We generate both server-side so the client can't pick a weak
-- token or a colliding code. user_id is taken from the session, not trusted
-- from the client.
-- ============================================================
create or replace function public.create_live_game(
  p_game_type      text,
  p_buy_in         numeric,
  p_initial_chances integer,
  p_initial_pool   jsonb,
  p_current_state  jsonb,
  p_display_config jsonb default '{}'::jsonb
)
returns table (short_code text, control_token text)
language plpgsql
security definer
-- include `extensions` so digest()/gen_random_bytes() resolve regardless of
-- where pgcrypto is installed.
set search_path = public, extensions
as $$
declare
  -- Ambiguity-free alphabet (no O/0/I/1) so codes are easy to read & type.
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code     text;
  v_token    text;
  v_id       uuid;
  v_attempts int := 0;
  i          int;
begin
  -- A 36-hex-char (144-bit) secret — far too large to guess.
  v_token := encode(gen_random_bytes(18), 'hex');

  loop
    -- Build a friendly "XXX-XXX" code from the safe alphabet.
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
      if i = 3 then v_code := v_code || '-'; end if;
    end loop;

    begin
      insert into public.live_games (
        short_code, game_type, buy_in, initial_chances,
        initial_pool, current_state, display_config, user_id
      )
      values (
        v_code, p_game_type, coalesce(p_buy_in, 0), p_initial_chances,
        p_initial_pool, p_current_state, coalesce(p_display_config, '{}'::jsonb), auth.uid()
      )
      returning id into v_id;
      exit; -- inserted cleanly with a unique code
    exception when unique_violation then
      -- Rare code collision — try again a few times, then give up loudly.
      v_attempts := v_attempts + 1;
      if v_attempts > 10 then
        raise exception 'could not allocate a unique board code';
      end if;
    end;
  end loop;

  insert into public.live_game_secrets (live_game_id, control_token_hash)
  values (v_id, encode(digest(v_token, 'sha256'), 'hex'));

  short_code := v_code;
  control_token := v_token;
  return next;
end;
$$;

-- ============================================================
-- update_live_game — write the live state, but ONLY for a caller holding the
-- board's control token. This is the single write path for the controller.
-- ============================================================
create or replace function public.update_live_game(
  p_short_code     text,
  p_token          text,
  p_current_state  jsonb,
  p_display_config jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id   uuid;
  v_hash text;
begin
  select g.id, s.control_token_hash
    into v_id, v_hash
  from public.live_games g
  join public.live_game_secrets s on s.live_game_id = g.id
  where g.short_code = p_short_code;

  if v_id is null then
    raise exception 'board not found';
  end if;

  -- Constant-ish check: the presented token must hash to the stored hash.
  if v_hash <> encode(digest(p_token, 'sha256'), 'hex') then
    raise exception 'invalid control token';
  end if;

  update public.live_games
  set current_state  = coalesce(p_current_state, current_state),
      display_config = coalesce(p_display_config, display_config),
      updated_at     = now()
  where id = v_id;
end;
$$;

-- ============================================================
-- end_live_game — let the controller tear the board down when the game's over.
-- Token-checked, same as updates. Cascades to the secret row.
-- ============================================================
create or replace function public.end_live_game(
  p_short_code text,
  p_token      text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id   uuid;
  v_hash text;
begin
  select g.id, s.control_token_hash
    into v_id, v_hash
  from public.live_games g
  join public.live_game_secrets s on s.live_game_id = g.id
  where g.short_code = p_short_code;

  if v_id is null then
    return; -- already gone; nothing to do
  end if;

  if v_hash <> encode(digest(p_token, 'sha256'), 'hex') then
    raise exception 'invalid control token';
  end if;

  delete from public.live_games where id = v_id;
end;
$$;

-- The three functions are the ONLY way clients touch this data. Direct table
-- insert/update/delete stays blocked by RLS.
grant execute on function public.create_live_game(text, numeric, integer, jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.update_live_game(text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.end_live_game(text, text) to anon, authenticated;
