# Sprint 2 — Save & Reuse

> **Phase:** 2 (Persistence)
> **Status:** ✅ **CODE COMPLETE + DATABASE LIVE + DATA PATH VERIFIED (2026-06-05).** Supabase project
> provisioned, schema migrated, Row-Level Security verified end-to-end against the real database. Auth
> (email + password) + full save/load/rename/duplicate/delete built and wired into the calculator. All
> pre-flight checks pass. **Only remaining:** a human browser click-through (sign up → save → reopen) and an
> optional one-click "disable email confirmation" toggle in the Supabase dashboard.
> **Goal:** Let a logged-in vendor SAVE a game setup and come back to reopen, rename, duplicate, and delete
> it — while the Phase 1 calculator stays fully usable with NO account.
> **Exit criterion:** Log in, save a game, reopen and duplicate it. (Met at the data-layer/verification level;
> final human-in-browser confirmation pending — see Session Log.)

---

## What this sprint adds (and what it must NOT break)

- Adds: accounts (email + password), saved games, and the UI to manage them.
- Must NOT break: the Phase 1 calculator works logged-out and even **before** Supabase is configured
  (graceful degradation). Saving is purely additive (Decision 008).
- Stays in-phase: no odds-sheet (Phase 3) or price-lookup (Phase 4) code.

## Task table

| # | Task | Status |
|---|------|--------|
| 1 | Stand up a clean Supabase project; wire env vars | ✅ Done (ref `txrlpwvmawwfuuzedfbw`) |
| 2 | Supabase SSR clients (browser + server) | ✅ Done (`lib/supabase/{client,server}.ts`) |
| 3 | Session refresh via Next.js 16 **Proxy** (renamed from middleware) | ✅ Done (`proxy.ts` + `lib/supabase/proxy.ts`) |
| 4 | Auth: email+password sign-in / sign-up / sign-out + email-confirm route | ✅ Done (`app/login/*`, `app/auth/confirm/route.ts`) |
| 5 | Schema + migration for `games` + `prize_items` | ✅ Done (`supabase/migrations/20260605120000_init_saved_games.sql`) |
| 6 | Row-Level Security (each vendor sees only their own games) | ✅ Done + **verified live** |
| 7 | Pure save/load serialization (calculator state ↔ DB rows) | ✅ Done (`lib/saved-games/serialize.ts`) + 6 tests |
| 8 | Server actions: list/create/update/load/rename/duplicate/delete | ✅ Done (`lib/saved-games/actions.ts`) |
| 9 | Saved-games UI bar in the calculator | ✅ Done (`components/calculator/SavedGamesBar.tsx`) |
| 10 | Account menu in header (logged-in email + log out / log in) | ✅ Done (`components/account/AccountMenu.tsx`) |
| 11 | Graceful degradation when Supabase isn't configured | ✅ Done (`lib/supabase/configured.ts`) |
| 12 | Apply migration to the live DB | ✅ Done (`supabase db push`) |
| 13 | Human browser click-through (sign up → save → reopen → duplicate) | ⏳ Pending owner |
| 14 | (Optional) disable email confirmation for instant signup | ⏳ Pending owner (one dashboard toggle) |

## Acceptance checks

- [x] The calculator still renders the worked example (41%) logged-out AND before Supabase is configured.
- [x] A logged-in user can insert a game + prize rows (verified via the service-role + anon test harness).
- [x] RLS: a second user cannot read or by-id-fetch the first user's games or prize_items (verified — 0 rows).
- [x] RLS: a user cannot insert a row claiming another user's `user_id` (verified — rejected).
- [x] The no-drift CHECK rejects a game whose solved-for knob is stored non-NULL (verified — rejected).
- [x] `/login` shows the email/password form when configured, a friendly notice when not.
- [ ] A human signs up in the browser, saves a game, reloads, reopens it, duplicates it. (Owner to confirm.)

## Session Log

### Session 3 — 2026-06-05 — Phase 2 / Sprint 2 BUILT + DB live + RLS verified

**Outcome:** Phase 2 is code-complete and the database is live and verified. Built Supabase email+password
auth on the **Next.js 16 SSR** pattern, the full saved-games CRUD, and wired it into the Phase 1 calculator
without disturbing the logged-out experience. Provisioned the real Supabase project, applied the migration,
and **verified the entire data path + RLS end-to-end against the live database** with a service-role/anon test
harness (then cleaned up the test users). Pre-flight: typecheck ✅, lint ✅, **37/37 tests ✅** (31 engine + 6
new serialization), build ✅.

**Auth + Supabase plumbing (newer-than-training Next.js 16).**
- `@supabase/ssr` 0.10.3 + `@supabase/supabase-js` 2.107. Browser client (`lib/supabase/client.ts`) and
  cookie-aware server client (`lib/supabase/server.ts`, async `cookies()`).
- **`middleware` is renamed to `proxy` in Next.js 16** — session refresh lives in root `proxy.ts` (calls
  `lib/supabase/proxy.ts` → `getClaims()`), runs on the Node runtime, matcher excludes static assets.
- **Auth is enforced inside the server actions + by RLS, NOT by the proxy** (per the Next.js docs warning that
  a matcher change can silently drop proxy coverage of server functions). The proxy only refreshes the cookie.
- Login UI: `app/login/page.tsx` + `components/account/LoginForm.tsx` (one card, toggles sign-in/sign-up via
  `useActionState`), server actions in `app/login/actions.ts` (`signIn`/`signUp`/`signOut`), email-confirm
  Route Handler `app/auth/confirm/route.ts` (used only if confirmations are ON).
- **Graceful degradation:** `lib/supabase/configured.ts` short-circuits the proxy, home page, and login page
  when env vars are absent, so the calculator never 500s before/without Supabase. Verified at runtime.

**Database (`supabase/`).**
- `config.toml` (project_id `mysterycalc`) + migration `20260605120000_init_saved_games.sql`:
  `games` (the saved setup; stores the two fixed knobs, NULLs the solved-for one, + `solve_for`, `lead_metric`)
  and `prize_items` (one row per prize, with `position` for order). CHECK constraints keep values in the
  engine's vocabulary and enforce the **no-drift rule** (solved knob must be NULL). `updated_at` auto-bumped by
  a trigger. **RLS ON** with owner-only select/insert/update/delete on both tables (prize_items scoped through
  the parent game).
- Applied with `supabase link` + `supabase db push` (the CLI was already authenticated and had DB access).

**Saved-games layer.**
- `lib/saved-games/serialize.ts` — pure translator between the calculator snapshot (on-screen text) and DB rows.
  Handles knob-nulling, margin percent↔fraction (35 ⇄ 0.35), and `position`. Covered by `tests/saved-games.test.ts` (6).
- `lib/saved-games/actions.ts` — server actions (auth-checked): `listGames`, `createGame`, `updateGame`,
  `loadGame`, `renameGame`, `duplicateGame`, `deleteGame`.
- `components/calculator/SavedGamesBar.tsx` — the strip above the calculator: Save / Save as new / My games
  (open, rename inline, duplicate, delete). Logged-out, it shows a "Log in to save" CTA.
- `Calculator.tsx` now lifts the lead-metric toggle into state, builds a `CalculatorSnapshot`, and exposes
  `applySnapshot` so a loaded game repopulates every field. `ResultsDashboard` is now controlled by that state
  (its key `"margin"` was renamed `"percent"` to match the DB).

**Live verification (against the real DB, then cleaned up).**
- Created two confirmed users via the admin API; signed both in via the anon client.
- A inserts a game + 2 prize_items → A reads 1, B reads 0 (own games), B reads 0 of A's by id, B reads 0 of
  A's prize_items → RLS isolation confirmed. CHECK rejects a non-NULL solved knob. B cannot insert as A.

**Decisions logged:** D-023 (login = email + password), D-024 (Phase 2 SSR auth architecture: @supabase/ssr +
proxy.ts + server-action/RLS enforcement + graceful degradation), D-025 (saved-games schema & serialization
rules), D-026 (live provisioning + verification record). See `DECISIONS_LOG.md`.

**Gotchas / landmines for next session:**
- **`middleware` → `proxy` in Next 16.** The file is `proxy.ts`, the function is `proxy`, it defaults to the
  Node runtime, and the matcher must exclude static assets. Don't reintroduce `middleware.ts`.
- **Email confirmation is likely ON by default.** Signup still works (the `/auth/confirm` route handles it),
  but the smoothest experience is to turn it OFF: Supabase Dashboard → Authentication → Sign In / Providers →
  Email → disable "Confirm email." Then signup logs the vendor in instantly.
- **Public key:** using the **legacy anon JWT** (verified working). A new-style publishable key
  (`sb_publishable_…`) is noted as a commented fallback in `.env.local` if the legacy key is ever disabled.
- **Don't rely on the proxy for authorization.** It only refreshes the session; every server action re-checks
  the user, and RLS is the real boundary.
- **`.env.local` is gitignored and holds live keys.** `.env.example` is the committed template. The
  service-role key is present for future use but unused in Phase 2 — never expose it client-side.
- The home page is now dynamic (`ƒ`) because it reads the session cookie — expected.
