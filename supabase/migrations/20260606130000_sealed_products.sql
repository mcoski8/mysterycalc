-- ============================================================
-- MysteryCalc — sealed-products price index (Phase 4 / Sprint 4.5, Decision 032).
--
-- Plain English: pokemontcg.io (our singles price source) has NO prices for
-- SEALED product — booster boxes, Elite Trainer Boxes, packs, bundles — which
-- mystery games use heavily as prizes. tcgcsv.com relays TCGPlayer's full
-- catalog (sealed included) for free, but it's a BULK download, not a
-- search-by-name API. So a nightly job copies just the sealed rows we need
-- into THIS table, and the app searches this table by name instead.
--
-- This is PUBLIC reference data (TCGPlayer catalog facts) — there is NO user
-- data here, no cost, no profit. Anyone may read it; only the server-side sync
-- (using the service-role key, which bypasses RLS) may write it. See
-- docs/modules/price-sources.md and scripts/sync-sealed.ts.
-- ============================================================

create table if not exists public.sealed_products (
  -- TCGPlayer's own product id (stable across syncs) — the natural primary key.
  product_id          bigint primary key,
  -- The full product name as TCGPlayer lists it (e.g. "Perfect Order Elite
  -- Trainer Box"). This is what the vendor searches and sees.
  name                text   not null,
  -- TCGPlayer's "clean" name (punctuation stripped) — handy for matching.
  clean_name          text,
  -- Which set/expansion this product belongs to (e.g. "Perfect Order").
  set_name            text,
  -- tcgcsv "group" id (== a set). We refresh prices group-by-group, so we
  -- keep this to know which groups are already indexed.
  group_id            bigint not null,
  -- Small catalog image, if any (host-agnostic <img> renders it, Decision 030).
  image_url           text,
  -- The sold-derived "what it's worth" number — the value we auto-fill as a
  -- prize's market value. Always present (we only index priced products).
  market_price        numeric not null,
  -- The cheapest listing — a useful floor/acquisition reference, stored for
  -- possible future use; the app leads with market_price.
  low_price           numeric,
  -- A tidy human label derived from the name during sync: 'Booster Box',
  -- 'Elite Trainer Box', 'Booster Pack', 'Blister', 'Bundle', 'Tin',
  -- 'Collection', or 'Other'. Used for a badge in the picker.
  product_type        text   not null default 'Other',
  -- When TCGPlayer's price for this row was last refreshed by our sync.
  prices_updated_at   timestamptz not null default now(),
  -- When our sync last touched this row at all (catalog or price).
  synced_at           timestamptz not null default now()
);

-- Case-insensitive name search. A simple trigram index keeps `ILIKE '%term%'`
-- fast; the catalog is only a few thousand rows, so this is plenty.
create extension if not exists pg_trgm;
create index if not exists sealed_products_name_trgm
  on public.sealed_products using gin (name gin_trgm_ops);
-- Group lookups for the nightly price-only refresh.
create index if not exists sealed_products_group_idx
  on public.sealed_products (group_id);

-- ============================================================
-- Row-Level Security.
--
-- Public catalog data: everyone (even logged-out visitors) may READ it, so the
-- price-lookup search works without an account. NO insert/update/delete policy
-- exists, so the only way to WRITE is the service-role key (it bypasses RLS),
-- which only our server-side sync holds. The browser can never modify it.
-- ============================================================
alter table public.sealed_products enable row level security;

create policy "anyone reads sealed products"
  on public.sealed_products for select
  using (true);
