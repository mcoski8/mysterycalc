-- ============================================================
-- MysteryCalc — saved games schema (Phase 2 / Sprint 2).
--
-- Plain English: this creates the two tables that let a logged-in vendor
-- SAVE a game setup and come back to it later. One row in `games` is one
-- saved game; its prizes live as rows in `prize_items`. Row-Level
-- Security (RLS) at the bottom guarantees a vendor can only ever see and
-- touch THEIR OWN games — the database enforces this, not just the UI.
--
-- The Phase 1 calculator does NOT depend on any of this; saving is purely
-- additive (Decision 008). See docs/modules/database-schema.md.
-- ============================================================

-- ------------------------------------------------------------
-- games — one row per saved game setup.
--
-- The three "knobs" (buy_in, chances, target_margin) are locked together:
-- the vendor fixes TWO and the engine derives the third. We store only the
-- two fixed values; the solved one is left NULL and recomputed at load
-- time (so it can never drift out of sync). `solve_for` records which knob
-- was the derived one. A CHECK constraint enforces this rule in the DB.
-- ------------------------------------------------------------
create table if not exists public.games (
  id            uuid primary key default gen_random_uuid(),
  -- Whose game this is. Cascade-deletes the game if the account is deleted.
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  -- One of the seven finite-pool game types (see lib/games/game-types.ts).
  game_type     text not null,
  -- Which knob the engine solves for: 'buyIn' | 'chances' | 'targetMargin'.
  solve_for     text not null,
  buy_in        numeric,             -- P, per chance (NULL when solved-for)
  chances       integer,             -- N (NULL when solved-for)
  target_margin numeric,             -- m, a fraction 0–1 (NULL when solved-for)
  -- Which of the three "cut" readings the vendor wants to lead with.
  lead_metric   text not null default 'percent',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Guardrails: keep stored values inside the engine's vocabulary.
  constraint games_game_type_chk
    check (game_type in ('oripa','mysteryBox','wallOfSleeves','slabLot','prizeWheel','kuji','razz')),
  constraint games_solve_for_chk
    check (solve_for in ('buyIn','chances','targetMargin')),
  constraint games_lead_metric_chk
    check (lead_metric in ('percent','profit','multiple')),
  -- No-drift rule: the knob we solve for must be the one stored as NULL,
  -- so the engine always recomputes it instead of trusting a stale number.
  constraint games_solved_knob_is_null_chk check (
    (solve_for = 'buyIn'        and buy_in        is null) or
    (solve_for = 'chances'      and chances       is null) or
    (solve_for = 'targetMargin' and target_margin is null)
  )
);

create index if not exists games_user_id_idx on public.games (user_id);
-- Most-recent-first listing in "My Games".
create index if not exists games_user_updated_idx on public.games (user_id, updated_at desc);

-- ------------------------------------------------------------
-- prize_items — one row per prize line inside a game's pool.
--
-- Carries TWO values on purpose: market_value (what it's worth → drives
-- the advertised pool + player odds) and cost (what the vendor paid →
-- drives true profit). `position` preserves the on-screen row order.
-- ------------------------------------------------------------
create table if not exists public.prize_items (
  id           uuid primary key default gen_random_uuid(),
  game_id      uuid not null references public.games (id) on delete cascade,
  name         text not null default '',
  -- Cosmetic label only (never affects the math): pack/sealed/single/...
  type         text not null default 'single',
  market_value numeric not null default 0,   -- per unit
  cost         numeric not null default 0,    -- per unit (vendor-only)
  quantity     integer not null default 0,
  is_filler    boolean not null default false,
  -- Keeps the prize rows in the same order the vendor entered them.
  position     integer not null default 0,

  constraint prize_items_type_chk
    check (type in ('pack','sealed','single','slab','voucher','filler'))
);

create index if not exists prize_items_game_id_idx on public.prize_items (game_id, position);

-- ------------------------------------------------------------
-- Keep games.updated_at honest: bump it automatically on every update so
-- "most recently edited" sorting in "My Games" is always correct.
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_touch_updated_at on public.games;
create trigger games_touch_updated_at
  before update on public.games
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Row-Level Security — the real security boundary.
--
-- With RLS ON and these policies, a logged-in user can only read/write
-- rows that belong to them. Even if the UI had a bug, the database would
-- refuse to return or change another vendor's games.
-- ============================================================
alter table public.games        enable row level security;
alter table public.prize_items  enable row level security;

-- games: a user may do anything to their OWN rows, nothing to others'.
-- (auth.uid() is the id of the currently logged-in user.)
create policy "owner reads own games"   on public.games for select
  using (auth.uid() = user_id);
create policy "owner inserts own games" on public.games for insert
  with check (auth.uid() = user_id);
create policy "owner updates own games" on public.games for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner deletes own games" on public.games for delete
  using (auth.uid() = user_id);

-- prize_items: access is granted only when the parent game belongs to the
-- user. We check that by looking up the game and confirming its user_id.
create policy "owner reads own prize_items" on public.prize_items for select
  using (exists (
    select 1 from public.games g
    where g.id = prize_items.game_id and g.user_id = auth.uid()
  ));
create policy "owner inserts own prize_items" on public.prize_items for insert
  with check (exists (
    select 1 from public.games g
    where g.id = prize_items.game_id and g.user_id = auth.uid()
  ));
create policy "owner updates own prize_items" on public.prize_items for update
  using (exists (
    select 1 from public.games g
    where g.id = prize_items.game_id and g.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.games g
    where g.id = prize_items.game_id and g.user_id = auth.uid()
  ));
create policy "owner deletes own prize_items" on public.prize_items for delete
  using (exists (
    select 1 from public.games g
    where g.id = prize_items.game_id and g.user_id = auth.uid()
  ));
