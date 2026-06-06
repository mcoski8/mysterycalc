# Current: Phase 3 / Sprint 3 (Customer Odds Sheet) — ✅ BUILT + owner-verified. **Phase 4 (Price Lookup) is next.**

> Updated: 2026-06-06 (end of Session 4)
> Status: **Phase 2 is fully Complete** (the owner confirmed the browser click-through — sign up → save →
> reopen → duplicate). **Phase 3 / Sprint 3 (Customer Odds Sheet) is built and owner-verified in the browser**,
> print/PDF first: a logged-in vendor turns any *saved* game into a clean customer-facing sheet (prize pool +
> per-prize odds) and prints it or saves a PDF. The hard rule — **no cost/profit/margin on the customer sheet**
> — is enforced by a test. A public no-login share link is **deferred to Phase 3+** (Decision 027).
> Active handoff: **`docs/handoff/MASTER_HANDOFF_01.md`** (Session 4 appended; **~14.6KB — ROLL to
> `MASTER_HANDOFF_02.md` at the start of next session**).
> Anchoring docs: `docs/CLAUDE.md` (master context), `docs/sprints/s3-odds-sheet.md` (this sprint),
> `docs/modules/odds-sheet.md` (now implemented), `docs/modules/price-sources.md` (Phase 4),
> `docs/DECISIONS_LOG.md` (001–028).

---

## What MysteryCalc is (one paragraph)

A free web app for **vendors** to **design and price mystery games** (oripa, mystery boxes, walls of sleeves,
prize wheels, kuji, razzes — the finite-pool family). Enter prizes (market value AND your cost), pick a game
type, set any two of {buy-in price, number of chances, target margin}, and it solves the third — then shows
profit three ways, hit rate, prize-tier breakdown, and break-even. **Log in to save your games, and print a
customer-facing odds sheet for any saved game.** Stack: Next.js 16 + Supabase + Vercel.

## What was completed (Session 4 — Sprint 3)

- **Phase 2 gate fully closed** — owner confirmed the browser click-through (sign up → build → save → reload →
  reopen → duplicate). S2 + Phase 2 are now Complete.
- **Customer Odds Sheet (print/PDF) built + owner-verified**, end to end:
  - **Pure builder** `lib/odds-sheet/build.ts` → an `OddsSheet` view-model from a saved game. Reuses the
    engine's `perPrizeOdds` (no new math). **Builds no cost/profit/margin field** (customer-safe by design).
  - **Pure helper** `snapshotToSolveInput` in `lib/saved-games/serialize.ts` (snapshot → engine `{items, config}`).
  - **Server action** `loadGameForSheet(id)` (auth-checked) → `{ name, snapshot }`.
  - **Route** `app/games/[id]/odds/page.tsx` — auth-gated, RLS-protected, friendly error on a broken pool.
  - **UI** `components/odds-sheet/OddsSheetView.tsx` — printable sheet, optional editable shop/event name,
    Print/Back (`.no-print`), odds as `%` + "1 in N", razz single-winner note. + `@media print` in `globals.css`.
  - **Entry point** — "Customer odds sheet" link per saved game in `SavedGamesBar.tsx` (opens in a new tab).
  - **Tests** `tests/odds-sheet.test.ts` (4) incl. the **no-leak** guard.
- **Decisions 027–028 logged.** Pre-flight all green: typecheck ✅, lint ✅, **41/41 tests ✅**, build ✅.

## In progress

- Nothing actively coding. Sprint 3 build is closed.

## Not started yet

- **Phase 4 — Price Lookup** (card search → auto-fill market value). See `docs/modules/price-sources.md`.
- **Deferred (Phase 3+):** public no-login share link for the odds sheet.
- Phase 5 (Launch, incl. the broad UI/UX polish pass the owner flagged).

## Blockers / open items

- **None blocking.** App runs with `npm run dev`; the live Supabase project is wired in.
- **Handoff roll due:** `MASTER_HANDOFF_01.md` is ~14.6KB — close it and start `MASTER_HANDOFF_02.md` next session.
- Soft: email confirmation is still at the Supabase default; the app handles it via `/auth/confirm`. Optional
  one-toggle dashboard change for instant signup.

## Gotchas / lessons

- **Don't construct JSX inside a `try/catch`** in a Server Component — ESLint `react-hooks/error-boundaries`
  errors. Compute the result into a variable inside the `try`, then return the JSX after the block.
- **`perPrizeOdds` carries no market value** — the odds sheet merges each prize's value by *item position*;
  the only extra entry is razz's trailing "No prize" line (worth $0, no matching item). If the engine ever
  reorders `perPrizeOdds`, revisit `buildOddsSheet`.
- **The customer sheet must never show cost/profit/margin** — guaranteed structurally (the builder doesn't
  build those fields) and guarded by `tests/odds-sheet.test.ts`. Keep it that way.
- **Public share link ≠ relaxing RLS.** `games`/`prize_items` rows contain cost; a future share link needs a
  share token + a public-read path that exposes only the customer-safe fields.
- **Next 16:** `middleware`→`proxy` (file `proxy.ts`, fn `proxy`, Node runtime); a dynamic route's `params` is
  a Promise (await it). Don't trust the proxy for authz — server actions re-check the user + RLS is the boundary.
- The shop/event name on the sheet is **transient** (on-page only, not saved).

## Immediate next actions

1. **Roll the handoff:** close `MASTER_HANDOFF_01.md` with a "covers Sessions 1–4" header and create
   `MASTER_HANDOFF_02.md`; point this file at it.
2. **Start Phase 4 — Price Lookup:** read `docs/modules/price-sources.md`; implement the pluggable
   price-source interface (pokemontcg.io / TCGPlayer) so a card search auto-fills market value, with manual
   entry remaining as the fallback. Mind rate-limiting/caching.
3. **Stay in-phase** — the public odds-sheet share link is a Phase 3+ follow-on, not Phase 4 work; don't start
   it unless the owner re-prioritizes.

## Resume prompt for next session

```
MysteryCalc — Phases 1–3 are DONE. Phase 1 (calculator engine + UI), Phase 2 (Supabase auth + save/reuse,
RLS-verified, owner browser click-through confirmed), and Phase 3 (Customer Odds Sheet — print/PDF) are all
built and owner-verified. All pre-flight passes (typecheck / lint / 41 tests / build). NEXT UP: Phase 4 —
Price Lookup.

WHAT MYSTERYCALC IS: a free Next.js web app for VENDORS to design & price mystery games (oripa, mystery boxes,
walls of sleeves, prize wheels, kuji, razz — the finite-pool family). Enter prizes (market value AND cost) →
pick a game type → set any two of {buy-in P, # chances N, target margin m} → solve the third → see profit
three ways, hit rate, prize-tier breakdown, break-even. Log in to SAVE games, and PRINT a customer odds sheet
from any saved game. Stack: Next.js 16 + TS + Tailwind v4 + shadcn + Supabase + Vercel.

FIRST THING THIS SESSION: roll the handoff — MASTER_HANDOFF_01.md is ~14.6KB; close it with a "covers Sessions
1–4" header and start docs/handoff/MASTER_HANDOFF_02.md, then point CURRENT_PHASE.md at it.

PHASE 3 KEY CODE (just shipped): pure builder lib/odds-sheet/build.ts (buildOddsSheet → OddsSheet view-model,
NO cost/profit/margin), pure helper snapshotToSolveInput in lib/saved-games/serialize.ts, server action
loadGameForSheet in lib/saved-games/actions.ts, route app/games/[id]/odds/page.tsx (auth-gated + RLS),
components/odds-sheet/OddsSheetView.tsx (printable + optional shop name + Print/Back), @media print in
app/globals.css, "Customer odds sheet" link per game in components/calculator/SavedGamesBar.tsx,
tests/odds-sheet.test.ts (incl. the no-leak guard). PHASE 1 ENGINE: lib/engine/* (barrel @/lib/engine),
lib/pool, lib/games, lib/types; tests/engine.test.ts. PHASE 2: Supabase clients lib/supabase/*, root proxy.ts,
auth app/login/* + app/auth/confirm, saved-games lib/saved-games/* + SavedGamesBar.tsx, migration
supabase/migrations/20260605120000_init_saved_games.sql.

PHASE 4 = PRICE LOOKUP (this session's work): read docs/modules/price-sources.md. Implement the pluggable
price-source interface (pokemontcg.io / TCGPlayer) so a card search auto-fills market value; manual entry
stays as the fallback. Mind rate-limiting + caching. Exit gate: search a card → market value auto-fills.

SUPABASE: project ref txrlpwvmawwfuuzedfbw (https://txrlpwvmawwfuuzedfbw.supabase.co). Keys in gitignored
.env.local (legacy anon JWT in use; sb_publishable_ fallback commented). CLI linked; `supabase db push` applies
migrations. Email confirmation at the default — app handles via /auth/confirm; turning it OFF = instant signup.

DEFERRED (Phase 3+, do NOT start unless re-prioritized): public no-login odds-sheet share link — needs a share
token + a public-read path that exposes ONLY customer-safe fields. DO NOT relax RLS on games/prize_items (those
rows contain cost). Known debt: broad UI/UX polish → Phase 5 (Launch).

GOTCHAS: Don't construct JSX inside a try/catch in a Server Component (ESLint react-hooks/error-boundaries) —
compute into a var, return JSX after. perPrizeOdds carries no market value (sheet merges by item position;
razz adds a trailing "No prize" $0 line). Customer sheet must never show cost/profit/margin (guarded by test).
Next 16: middleware→proxy (file proxy.ts, fn proxy, Node runtime); dynamic route params is a Promise (await).
NEVER trust the proxy for authz — server actions re-check the user + RLS is the boundary. Stay on Vitest 3
(Decision 020). Secrets only in .env.local; never commit or expose the service-role key.

READ AT SESSION OPEN: docs/CLAUDE.md, docs/CURRENT_PHASE.md, docs/sprints/SPRINT_INDEX.md, the active sprint
file, docs/modules/price-sources.md (Phase 4), and DECISIONS_LOG.md (001–028). Follow AGENTS.md (comment
standard for technical + semi-non-technical readers; append-only docs; stay in-phase; Next.js is newer than
training — check node_modules/next/dist/docs/).

AT SESSION CLOSE: follow docs/session-end-prompt.md line by line; update the sprint file + checklist +
SPRINT_INDEX; append DECISIONS + handoff (roll to _02 first); rewrite this file; commit + push to origin/main
(Decision 019, pre-authorized); end with the verbatim resume prompt.
```

---

*This file is REWRITTEN (not appended) at the end of every session.*
