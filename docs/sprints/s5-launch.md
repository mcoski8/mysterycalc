# Sprint 5 — Launch (Phase 5)

> **Phase 5 exit criterion:** Live at a real domain on Vercel, free.
> **Status: COMPLETE — 2026-06-06.** Live at **https://mysterycalc.vercel.app** (Vercel Hobby, free).

---

## Goal

Take the feature-complete app (Phases 1–4 done, owner-verified) public: a UI/UX + accessibility
polish pass, deploy to Vercel, settle the final public name, and ship the legal footer — then
activate the nightly sealed-price cron that was wired-but-dormant since Sprint 4.5.

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Final public name (Decision 017) | **Done** — "MysteryCalc" (Decision 033) |
| 2 | "Not affiliated" disclaimer app-wide (Decision 012) | **Done** — shared `SiteFooter` in root layout |
| 3 | Accessibility pass — landmarks + skip link | **Done** — `<main id="main-content">` on every page + skip-to-content link |
| 4 | SEO/social metadata | **Done** — OpenGraph/Twitter/robots/theme-color + `metadataBase` |
| 5 | Pre-flight (typecheck / lint / 57 tests / build) | **Done** — all green |
| 6 | Deploy to Vercel (free `.vercel.app`) | **Done** — `mysterycalc.vercel.app` (Decision 034) |
| 7 | Set Vercel env vars + activate sealed cron | **Done** — prod+dev Supabase vars; prod `CRON_SECRET`; cron live (401 without secret) |
| 8 | Connect GitHub for auto-deploy | **Done** — repo connected on `vercel link`; pushes auto-deploy |
| 9 | Custom domain | **Deferred** (Decision 034) — free subdomain meets the exit criterion; add via dashboard anytime |
| 10 | Preview-env Supabase vars | **Deferred** — CLI v54.6.1 quirk; not needed for prod; add via dashboard |

## What shipped (files)

**New**
- `components/SiteFooter.tsx` — app-wide footer; the Decision 012 disclaimer ("planning tool only…
  not affiliated with Nintendo / The Pokémon Company") rendered once in the root layout, `no-print`.

**Changed**
- `app/layout.tsx` — enriched `metadata` (title template, OpenGraph, Twitter card, robots,
  `applicationName`, `metadataBase` derived from `NEXT_PUBLIC_SITE_URL` / `VERCEL_PROJECT_PRODUCTION_URL`),
  a `viewport.themeColor`, a skip-to-content link, and the `<SiteFooter />`. Body is `flex min-h-full
  flex-col` (sticky footer).
- `app/page.tsx` — removed the page-local footer (now app-wide); wrapped the calculator in
  `<main id="main-content">`.
- `app/login/page.tsx` — both render branches now use `<main id="main-content">`.
- `app/games/[id]/odds/page.tsx` — the `Problem` fallback is now a `<main id="main-content">`.
- `components/odds-sheet/OddsSheetView.tsx` — outer container is now `<main id="main-content">`
  (its own print footer/disclaimer is unchanged; the app-wide `SiteFooter` is `no-print` so the
  customer print sheet is unaffected).

## Deploy facts (for the next session)

- **Live URL:** https://mysterycalc.vercel.app · **Inspector:** Vercel project
  `michaels-projects-eace96e9/mysterycalc` (account `mcoski-5509`, Hobby/free plan).
- **Git auto-deploy:** the GitHub repo (`github.com/mcoski8/mysterycalc`) is connected — every push to
  `origin/main` triggers a production deploy. (So the session-end push also redeploys.)
- **Env vars set in Vercel:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (Production + Development); `CRON_SECRET` (Production only, generated at
  deploy with `openssl rand -hex 32` — Vercel re-sends it to the cron automatically, so its value is
  never needed again; rotate by re-adding if ever required).
- **Cron:** `/api/cron/sync-sealed` runs daily 09:00 UTC (`vercel.json`); verified it returns **401**
  without the secret. The sealed index is no longer dependent on the local `tsx` script.

## Owner follow-ups (Supabase dashboard — optional, not blocking)

These affect *new-account signup email* only; the calculator, saved games for existing users, odds
sheet, and price lookup all work now.
1. **Set the Supabase Site URL to the production URL** so confirmation/reset emails link to the live
   site, not localhost: Supabase → Authentication → URL Configuration → Site URL =
   `https://mysterycalc.vercel.app`; add it to the Redirect URLs allow-list too.
2. **(Optional) Turn OFF "Confirm email"** for instant signup (Supabase → Authentication → Providers →
   Email). Noted since Decision 026; the app handles confirmation either way via `/auth/confirm`.

## Session log

### 2026-06-06 — Session 7 — Phase 5 Launch COMPLETE
- Settled the final name as **MysteryCalc** (Decision 033) and the free-domain launch (Decision 034).
- Accessibility + SEO polish pass (shared footer, landmarks, skip link, metadata).
- Pre-flight green: typecheck ✅, lint ✅, **57/57 tests ✅**, build ✅.
- Deployed to Vercel (free), connected GitHub auto-deploy, set env vars, **activated the sealed cron**.
- Verified live: home 200 (title/disclaimer/skip-link/OG present), login 200, cron 401, price-search
  API returns sealed candidates against the live index. **Phase 5 exit criterion met.**
