# Current: 🚀 LAUNCHED — all 5 phases COMPLETE. App is live.

> Updated: 2026-06-06 (end of Session 7)
> Status: **MysteryCalc is LIVE at https://mysterycalc.vercel.app** (Vercel Hobby/free). **Phase 5 (Launch)
> is complete — every phase (1–5) is done and owner-verified.** This session: settled the final name
> (MysteryCalc), did an accessibility + SEO polish pass, deployed to Vercel with GitHub auto-deploy, and
> **activated the nightly sealed-price cron**. The product is shipped.
> Active handoff: **`docs/handoff/MASTER_HANDOFF_02.md`** (Session 7 appended; ~14KB — roll to `_03` next session).
> Anchoring docs: `docs/CLAUDE.md` (master context), `docs/sprints/s5-launch.md` (this sprint),
> `docs/DECISIONS_LOG.md` (001–034).

---

## What MysteryCalc is (one paragraph)

A free web app for **vendors** to **design and price mystery games** (oripa, mystery boxes, walls of sleeves,
prize wheels, kuji, razzes — the finite-pool family). Enter prizes (market value AND your cost), pick a game
type, set any two of {buy-in price, number of chances, target margin}, and it solves the third — then shows
profit three ways, hit rate, prize-tier breakdown, and break-even. **Log in to save your games, print a
customer-facing odds sheet, and look up a card OR sealed product's market value by name.** Stack: Next.js 16 +
Supabase + Vercel. **Live at https://mysterycalc.vercel.app.**

## What was completed (Session 7 — Phase 5: Launch)

- **Deployed live: https://mysterycalc.vercel.app** — Vercel **Hobby (free)**, project
  `michaels-projects-eace96e9/mysterycalc`, **GitHub repo connected** so every push to `origin/main`
  auto-deploys production. **Phase 5 exit criterion met.**
- **Final public name = "MysteryCalc"** (Decision 033, confirms 017). **Free `.vercel.app` domain**
  (Decision 034); custom domain deferred (one dashboard step, no code change).
- **Accessibility + SEO polish:** app-wide `SiteFooter` (the "not affiliated" disclaimer, Decision 012, now on
  every page via the root layout, `no-print`); `<main id="main-content">` landmarks + a skip-to-content link;
  enriched metadata (OpenGraph/Twitter/robots/theme-color, `metadataBase` from the Vercel URL).
- **Nightly sealed-price cron ACTIVATED** — set `CRON_SECRET` + Supabase env vars in Vercel;
  `/api/cron/sync-sealed` runs daily 09:00 UTC (verified 401 without the secret). No longer dependent on the
  local `tsx` script.
- **Pre-flight all green:** typecheck ✅, lint ✅, **57/57 tests ✅**, build ✅. **Verified live:** home 200
  (title/disclaimer/skip-link/OG present), login 200, cron 401, price-search API returns sealed candidates.

## In progress

- Nothing. The product is launched; all five phases are complete.

## Not started / open (none blocking — the product is live)

- **Owner Supabase-dashboard follow-ups (optional, affect NEW-signup email only):** set Auth → URL
  Configuration → Site URL = `https://mysterycalc.vercel.app` (+ Redirect allow-list) so confirmation/reset
  emails point to production, not localhost; optionally turn OFF "Confirm email" for instant signup
  (Decision 026). The calculator, existing-user saves, odds sheet, and price lookup all work live now.
- **Custom domain** — deferred (Decision 034); add via Vercel dashboard, then set `NEXT_PUBLIC_SITE_URL`.
- **Preview-env Supabase vars** — not set (CLI v54.6.1 quirk); add via dashboard if preview deploys ever need
  login/save.
- **Backlog (unchanged):** public no-login odds-sheet **share link** (share token + public-read that still
  hides cost — do NOT relax RLS on `games`/`prize_items`); Live Box Breaks model; buyer "should I play" mode.

## Blockers / open items

- **None.** App is live and fully functional.

## Gotchas / lessons

- **Git push = production deploy** — the repo is connected to Vercel; any `origin/main` push redeploys prod.
  Keep `main` releasable.
- **`metadataBase` chain:** `NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → localhost. A custom
  domain needs `NEXT_PUBLIC_SITE_URL` set in Vercel, or OG/canonical URLs stay on `.vercel.app`.
- **`CRON_SECRET` lives only in Vercel (prod)** — auto-sent to the cron; its value is never needed again
  (rotate by re-adding). To hit the cron route manually: `Authorization: Bearer <secret>`.
- **App-wide footer is `no-print`** — the customer odds sheet keeps its own footer; don't double up.
- (Still true) **Sealed detection = field-absence, not keywords (Decision 032). `npx tsx scripts/sync-sealed.ts`
  refreshes the index on demand; the cron now also keeps it fresh. Search route cache/limit are in-memory only.**

## Immediate next actions

1. **The product is launched — there is no required next coding task.** If continuing, the highest-value
   options are: the **public odds-sheet share link** (backlog), or guiding the owner through the optional
   **Supabase Site URL** dashboard step so new-signup emails point at production.
2. **If adding a custom domain:** register it, add it in the Vercel dashboard (Project → Domains), then set
   `NEXT_PUBLIC_SITE_URL` in Vercel so metadata/OG tags use it.
3. **Roll the handoff:** `MASTER_HANDOFF_02.md` is ~14KB — close it with a summary header and start
   `MASTER_HANDOFF_03.md`, then point this file at it.

## Resume prompt for next session

```
MysteryCalc is LAUNCHED — all five phases are DONE and owner-verified, and the app is LIVE at
https://mysterycalc.vercel.app (Vercel Hobby/free, project michaels-projects-eace96e9/mysterycalc, GitHub repo
connected so every push to origin/main auto-deploys production). Phases: 1 (calculator engine + UI), 2 (Supabase
auth + save/reuse, RLS), 3 (Customer Odds Sheet print/PDF), 4 + 4.5 (Price Lookup — singles via pokemontcg.io +
SEALED via tcgcsv; graded stays manual), 5 (Launch). The nightly sealed-price cron is ACTIVE
(/api/cron/sync-sealed, daily 09:00 UTC, CRON_SECRET-gated). All pre-flight passes (typecheck / lint / 57 tests
/ build).

WHAT MYSTERYCALC IS: a free Next.js web app for VENDORS to design & price mystery games (oripa, mystery boxes,
walls of sleeves, prize wheels, kuji, razz — the finite-pool family). Enter prizes (market value AND cost) →
pick a game type → set any two of {buy-in P, # chances N, target margin m} → solve the third → see profit three
ways, hit rate, prize-tier breakdown, break-even. Log in to SAVE games, PRINT a customer odds sheet, and LOOK UP
a card or sealed product's market value by name. Stack: Next.js 16 + TS + Tailwind v4 + shadcn + Supabase +
Vercel. Public name is "MysteryCalc" (Decision 033, final). Repo: github.com/mcoski8/mysterycalc.

THERE IS NO REQUIRED NEXT CODING TASK — the product is shipped. Highest-value optional work, in order:
1. OWNER SUPABASE-DASHBOARD FOLLOW-UPS (optional, affect NEW-signup email only; everything else works live):
   Supabase → Authentication → URL Configuration → Site URL = https://mysterycalc.vercel.app (and add it to the
   Redirect URLs allow-list) so confirmation/reset emails link to production, not localhost; optionally turn OFF
   "Confirm email" (Auth → Providers → Email) for instant signup (Decision 026). These are dashboard clicks —
   give the owner click-by-click.
2. PUBLIC NO-LOGIN ODDS-SHEET SHARE LINK (the main backlog feature, deferred since Phase 3 / Decision 027): needs
   a share token + a public-read path that STILL hides the vendor's cost/profit — do NOT relax RLS on
   `games`/`prize_items` (they contain cost). Build a separate public-safe view, mirror the Decision 028
   test-enforced "no vendor secrets" boundary.
3. CUSTOM DOMAIN (deferred, Decision 034): register it, add in Vercel dashboard (Project → Domains), then set
   NEXT_PUBLIC_SITE_URL in Vercel so metadataBase/OG tags use it.

DEPLOY FACTS: Vercel CLI authenticated as mcoski-5509. `vercel --prod` deploys; git push to origin/main also
auto-deploys. Env vars in Vercel: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY /
SUPABASE_SERVICE_ROLE_KEY (Production+Development) + CRON_SECRET (Production). Preview-env Supabase vars NOT set
(CLI v54.6.1 `git_branch_required` quirk on the non-interactive "all Preview" path) — add via dashboard if
preview login/save is ever needed. GOTCHA: keep `main` releasable (push = prod deploy). metadataBase resolves
NEXT_PUBLIC_SITE_URL → VERCEL_PROJECT_PRODUCTION_URL → localhost.

GOTCHAS (still true): Sealed detection = FIELD-ABSENCE (no Number/no Rarity), NOT name keywords (Decision 032).
`npx tsx scripts/sync-sealed.ts` refreshes the sealed index on demand (the cron now also does, nightly);
lib/sealed/* use RELATIVE imports (not @/) so tsx resolves them. NEVER partial-column-upsert sealed_products
(NOT-NULL columns reject it — one full-sync path only). React 19/Next 16 lint: no synchronous setState in an
effect body (derive at render). Card image hosts migrate (images.pokemontcg.io ↔ images.scrydex.com) — use a
host-agnostic <img>, not next/image (Decision 030). Search route cache + rate limit are IN-MEMORY only. Next 16:
middleware→proxy (proxy.ts, Node runtime); NEVER trust the proxy for authz — server actions re-check the user +
RLS is the boundary. Stay on Vitest 3 (Decision 020). The app-wide SiteFooter is no-print (the odds sheet keeps
its own footer). Secrets only in .env.local / Vercel; never commit or expose the service-role key.

SUPABASE: project ref txrlpwvmawwfuuzedfbw (https://txrlpwvmawwfuuzedfbw.supabase.co). Keys in gitignored
.env.local (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY + SUPABASE_SERVICE_ROLE_KEY) and mirrored in Vercel. CLI linked;
`supabase db push` applies migrations (init + sealed_products both applied to remote).

READ AT SESSION OPEN: docs/CLAUDE.md, docs/CURRENT_PHASE.md, docs/sprints/SPRINT_INDEX.md, docs/sprints/s5-launch.md,
docs/modules/price-sources.md, and DECISIONS_LOG.md (001–034). Follow AGENTS.md (comment standard for technical +
semi-non-technical readers; append-only docs; stay in-phase; Next.js is newer than training — check
node_modules/next/dist/docs/).

AT SESSION CLOSE: follow docs/session-end-prompt.md line by line; update the sprint file + checklist +
SPRINT_INDEX; append DECISIONS + handoff (roll MASTER_HANDOFF_02 → _03, it's ~14KB); rewrite this file; commit +
push to origin/main (Decision 019, pre-authorized — note: push also redeploys prod); end with the verbatim
resume prompt.
```

---

*This file is REWRITTEN (not appended) at the end of every session.*
