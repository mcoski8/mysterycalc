# Module — Database Schema (saved games)

> **Location (planned):** `supabase/migrations/`.
> **Status:** Spec only (Phase 2 — Save & Reuse). The Phase 1 calculator works with NO database.
> **Related:** Decision 008 (save/reuse needs accounts), `docs/modules/prize-pool.md`.

---

## What this module does (plain English)

Once a vendor logs in, this is where their **saved game setups** live so they can come back, tweak, and reuse
them. Phase 1's calculator is stateless (nothing is stored); this schema is what turns it into "my games I can
revisit." Each vendor only ever sees their own games.

## Storage choice

**Supabase (Postgres + Auth)** — same as PokeHolder, so we reuse auth, row-level security (RLS), and deploy
patterns. Auth identifies the user; RLS guarantees one user can't read another's games.

## Tables (illustrative — finalize in Phase 2)

### `games`
One row per saved game setup.
| column | type | notes |
|--------|------|-------|
| `id` | uuid (pk) | |
| `user_id` | uuid | FK → auth user; RLS scopes every query to this |
| `name` | text | vendor's label, e.g. "Indy Regionals wall" |
| `game_type` | text | one of the v1 game types (`docs/modules/game-types.md`) |
| `buy_in` | numeric | P, if the vendor fixed it (nullable) |
| `chances` | integer | N, if fixed (nullable) |
| `target_margin` | numeric | m (0–1), if fixed (nullable) |
| `lead_metric` | text | `percent` \| `profit` \| `multiple` (Decision 005) |
| `created_at` / `updated_at` | timestamptz | |

GOTCHA: exactly **two** of {`buy_in`, `chances`, `target_margin`} are meaningful per the solve-for model; the
third is derived by the engine at load time, not stored as truth. Storing all three risks drift — store the
two the vendor fixed and recompute the third.

### `prize_items`
One row per prize line in a game's pool.
| column | type | notes |
|--------|------|-------|
| `id` | uuid (pk) | |
| `game_id` | uuid | FK → `games.id` (cascade delete) |
| `name` | text | |
| `type` | text | `pack \| sealed \| single \| slab \| voucher \| filler` |
| `market_value` | numeric | per unit |
| `cost` | numeric | per unit (vendor-only) |
| `quantity` | integer | |
| `is_filler` | boolean | auto-managed filler line (`docs/modules/prize-pool.md`) |

### (Phase 3) `odds_sheets` — optional
If shareable odds sheets get their own persisted/short-linked record, add a table then; otherwise the sheet is
derived live from a game. Decide in Phase 3.

## Security (RLS)

- Every table has row-level security ON.
- Policy: a user can `select / insert / update / delete` **only rows where `user_id` = their auth id** (and
  `prize_items` joined through their `games`).
- The customer **odds sheet** (Phase 3), if shared publicly, exposes **only** market value + odds — never
  `cost`. Enforce that at the query/view layer, not just the UI (WARNING: cost must never reach a public sheet).

## Rules

- The Phase 1 calculator must not depend on any of this — saving is additive.
- Migrations are append-only files; never edit an applied migration (mirror the projects' migration discipline).
- Comment for technical + semi-non-technical readers per `docs/CLAUDE.md`.
