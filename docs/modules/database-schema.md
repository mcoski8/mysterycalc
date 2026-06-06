# Module — Database Schema (saved games)

> **Location:** `supabase/migrations/20260605120000_init_saved_games.sql` (applied to the live project).
> **Status:** ✅ **IMPLEMENTED & LIVE (Phase 2, 2026-06-05).** Applied via `supabase db push`; RLS verified
> end-to-end against the real database. The Phase 1 calculator still works with NO database (graceful
> degradation). The illustrative tables below were finalized into the migration — see **"As built"** notes.
> **Related:** Decisions 008 (save/reuse needs accounts), 023–026 (login method, auth architecture, schema &
> serialization rules, live provisioning), `docs/modules/prize-pool.md`, `lib/saved-games/serialize.ts`.

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

**As built (Decision 025):** the solved-for knob is stored **NULL**, `solve_for` records which one it is, and a
DB **CHECK constraint enforces** that the solved knob is NULL (so drift is impossible). `target_margin` is
stored as a fraction (0.35), converted to/from the UI percent ("35") in `lib/saved-games/serialize.ts`.
Additional CHECKs constrain `game_type`, `solve_for`, and `lead_metric` to the engine's vocabulary.
`created_at`/`updated_at` exist; `updated_at` is auto-bumped by a trigger so "My Games" sorts by most-recent.

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

**As built:** also has `position` (integer) to preserve the vendor's on-screen prize-row order on reload.

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
