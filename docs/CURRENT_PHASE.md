# Current: Phase 2 / Sprint 2 (Save & Reuse) — ✅ BUILT + DB LIVE + RLS VERIFIED. **Owner browser click-through is the last step; then Phase 3.**

> Updated: 2026-06-05 (end of Session 3 — Sprint 2 build)
> Status: **Phase 2 / Sprint 2 (Save & Reuse) is code-complete and the database is live and verified.** Email +
> password auth (Next.js 16 SSR pattern), the full save/load/rename/duplicate/delete flow, and Row-Level
> Security are all built and **verified end-to-end against the real Supabase database**. The Phase 1 calculator
> still works logged-out (and even before Supabase is configured). **Phase 2 exit gate is met at the
> data-layer/verification level; the only thing left is a human signing up in the browser and saving a game.**
> Active handoff: **`docs/handoff/MASTER_HANDOFF_01.md`** (Session 3 appended; ~11.6KB — roll near 15KB).
> Anchoring docs: `docs/CLAUDE.md` (master context), `docs/sprints/s2-save-and-reuse.md` (this sprint),
> `docs/modules/database-schema.md` (now implemented), `docs/DECISIONS_LOG.md` (001–026).

---

## What MysteryCalc is (one paragraph)

A free web app for **vendors** to **design and price mystery games** (oripa, mystery boxes, walls of sleeves,
prize wheels, kuji, razzes — the finite-pool family). Enter prizes (market value AND your cost), pick a game
type, set any two of {buy-in price, number of chances, target margin}, and it solves the third — then shows
profit three ways, hit rate, prize-tier breakdown, and break-even. **Now also: log in and save your games.**
Stack: Next.js 16 + Supabase + Vercel.

## What was completed (Session 3 — Sprint 2)

- **Supabase email+password auth on the Next.js 16 SSR pattern.** `@supabase/ssr` browser + server clients;
  session refresh in root **`proxy.ts`** (Next 16 renamed `middleware`→`proxy`). Login/sign-up/sign-out +
  an email-confirm route. Auth is enforced **inside the server actions + by RLS**, not by the proxy.
- **Live database.** `games` + `prize_items` tables with **Row-Level Security**, a no-drift CHECK (solved-for
  knob stored NULL), and an `updated_at` trigger. Migration applied to project **`txrlpwvmawwfuuzedfbw`** via
  `supabase db push`.
- **Save / load / rename / duplicate / delete** — pure serialization (`lib/saved-games/serialize.ts`, tested),
  auth-checked server actions (`lib/saved-games/actions.ts`), and a "Saved games" bar in the calculator.
- **Graceful degradation** — the whole Supabase layer stays dormant (no crashes) until env keys are present.
- **Verified live:** created two users, proved a user reads only their own games and cannot read/insert
  another's (RLS), and that the CHECK rejects a bad solved-knob — then cleaned up the test users.
- **All pre-flight green:** typecheck ✅, lint ✅, **37/37 tests ✅** (31 engine + 6 serialization), build ✅.
- **Decisions 023–026 logged.**

## In progress

- Nothing actively coding. Sprint 2 build is closed.

## Not started yet

- **Owner browser click-through** (the final Phase 2 gate confirmation — see next actions).
- Phase 3 (customer odds sheet), Phase 4 (price lookup), Phase 5 (launch).

## Blockers / open items

- **None blocking.** The app is ready to run (`npm run dev`) with the live Supabase project wired in.
- Soft: a human hasn't yet signed up + saved in a real browser (the data path is verified programmatically).
- Soft: email confirmation is at the Supabase default (likely ON). Signup still works via `/auth/confirm`;
  turning it OFF makes signup instant (one dashboard toggle).

## Gotchas / lessons

- **Next.js 16 renamed `middleware` → `proxy`.** File `proxy.ts`, function `proxy`, Node runtime, matcher
  excludes static assets. Don't reintroduce `middleware.ts`.
- **The proxy only refreshes the session — never rely on it for authorization.** Every server action re-checks
  the user; RLS is the real boundary (the Next docs warn a matcher change can silently drop proxy coverage).
- **Public key = legacy anon JWT** (verified working). A `sb_publishable_…` key is a commented fallback in
  `.env.local` if the legacy key is ever disabled.
- **Secrets live only in gitignored `.env.local`.** `.env.example` is the committed template. Never expose the
  service-role key client-side (it's unused in Phase 2 anyway).
- **No-drift rule:** the solved-for knob is stored NULL and recomputed on load; a DB CHECK enforces this.
- The home page is now dynamic (`ƒ`) because it reads the session cookie — expected.

## Immediate next actions

1. **Owner: run it and click through.** `cd /Users/michaelchang/CODE/mysterycalc && npm run dev`, open
   http://localhost:3000 → "Log in" → create an account → build a game → **Save** → reload → **My games** →
   open it → **Duplicate**. That confirms the Phase 2 exit gate in a real browser.
2. **(Optional, smoother signup)** Supabase Dashboard → Authentication → Sign In / Providers → Email → turn
   OFF "Confirm email." Then new accounts log in instantly (no email step).
3. **Then start Phase 3 — Customer Odds Sheet** (the engine already computes per-prize odds; build a
   printable/shareable sheet from a saved game — `docs/modules/odds-sheet.md`).

## Resume prompt for next session

```
MysteryCalc — Phase 2 / Sprint 2 (Save & Reuse) is BUILT, the Supabase database is LIVE, and Row-Level
Security is VERIFIED end-to-end. Email+password auth (Next.js 16 SSR pattern), full
save/load/rename/duplicate/delete, and per-user isolation all work; the Phase 1 calculator still works
logged-out and even before Supabase is configured. All pre-flight passes (typecheck/lint/37 tests/build).
The ONLY thing left for the Phase 2 gate is a human signing up in a browser and saving/reopening a game.

WHAT MYSTERYCALC IS: a free Next.js web app for VENDORS to design & price mystery games (oripa, mystery boxes,
walls of sleeves, prize wheels, kuji, razz — the finite-pool family). Enter prizes (market value AND cost) →
pick a game type → set any two of {buy-in P, # chances N, target margin m} → solve the third → see profit
three ways, hit rate, prize-tier breakdown, break-even. Stack: Next.js 16 + TS + Tailwind v4 + shadcn +
Supabase + Vercel.

PHASE 2 KEY CODE: Supabase clients lib/supabase/{client,server,proxy,configured}.ts + root proxy.ts (Next 16
renamed middleware→proxy). Auth: app/login/{page,actions}.ts, components/account/{LoginForm,AccountMenu}.tsx,
app/auth/confirm/route.ts. Saved games: lib/saved-games/{serialize,actions}.ts,
components/calculator/SavedGamesBar.tsx, tests/saved-games.test.ts. DB:
supabase/migrations/20260605120000_init_saved_games.sql (games + prize_items + RLS). Calculator.tsx lifts the
lead-metric toggle + builds a CalculatorSnapshot + applySnapshot. PHASE 1 ENGINE: lib/engine/* (barrel
@/lib/engine), lib/pool, lib/games, lib/types (now incl. LeadMetric), lib/errors; tests/engine.test.ts.

SUPABASE: project ref txrlpwvmawwfuuzedfbw (https://txrlpwvmawwfuuzedfbw.supabase.co). Keys are in gitignored
.env.local (legacy anon JWT in use; sb_publishable_ fallback commented). CLI is linked; `supabase db push`
applies migrations. Email confirmation is at the default (likely ON) — app handles it via /auth/confirm;
turning it OFF in the dashboard makes signup instant.

THIS SESSION OPTIONS: (a) help the owner do the browser click-through if not yet done, then (b) START PHASE 3
— Customer Odds Sheet: a printable/shareable odds sheet derived from a saved game (per-prize odds already
computed by the engine). See docs/modules/odds-sheet.md. Don't write Phase 4 (price lookup) code yet.

GOTCHAS: Next 16 middleware→proxy (file proxy.ts, fn proxy, Node runtime). NEVER rely on the proxy for authz —
server actions re-check the user + RLS is the boundary. Solved-for knob stored NULL (DB CHECK enforces
no-drift); margin stored as fraction. Vitest UI advisory affects only `vitest --ui` (we never run it) — stay
on Vitest 3 (Decision 020). Secrets only in .env.local; never commit or expose the service-role key.

READ AT SESSION OPEN: docs/CLAUDE.md, docs/CURRENT_PHASE.md, docs/sprints/SPRINT_INDEX.md, the active sprint
file, the relevant module doc (odds-sheet.md for Phase 3), and DECISIONS_LOG.md (001–026). Follow AGENTS.md
(comment standard for technical + semi-non-technical readers; append-only docs; stay in-phase; Next.js is
newer than training — check node_modules/next/dist/docs/).

AT SESSION CLOSE: follow docs/session-end-prompt.md line by line; update the sprint file + checklist +
SPRINT_INDEX; append DECISIONS + handoff; rewrite this file; commit + push to origin/main (Decision 019,
pre-authorized); end with the verbatim resume prompt.
```

---

*This file is REWRITTEN (not appended) at the end of every session.*
