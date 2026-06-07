# Current: Phase 4 COMPLETE (singles + sealed). **Next: Phase 5 — Launch.**

> Updated: 2026-06-06 (end of Session 6)
> Status: **Phases 1–4 are DONE and owner-verified.** Sprint 4.5 shipped this session: a vendor can now search
> **sealed product** (booster boxes, ETBs, packs) and have its **TCGPlayer market value** auto-fill a prize
> row — alongside the singles search from Sprint 4. **1,848 priced sealed products across all 217 Pokémon sets**
> are indexed in Supabase and searchable. Owner verified in the browser ("works as intended"). Price lookup is
> now complete (singles via pokemontcg.io + sealed via tcgcsv; graded stays manual). **Only Phase 5 (Launch)
> remains.**
> Active handoff: **`docs/handoff/MASTER_HANDOFF_02.md`** (Session 6 appended; ~9KB, still open).
> Anchoring docs: `docs/CLAUDE.md` (master context), `docs/sprints/s4.5-sealed-pricing.md` (this sprint),
> `docs/modules/price-sources.md` (now fully built), `docs/DECISIONS_LOG.md` (001–032).

---

## What MysteryCalc is (one paragraph)

A free web app for **vendors** to **design and price mystery games** (oripa, mystery boxes, walls of sleeves,
prize wheels, kuji, razzes — the finite-pool family). Enter prizes (market value AND your cost), pick a game
type, set any two of {buy-in price, number of chances, target margin}, and it solves the third — then shows
profit three ways, hit rate, prize-tier breakdown, and break-even. **Log in to save your games, print a
customer-facing odds sheet, and look up a card OR sealed product's market value by name.** Stack: Next.js 16 +
Supabase + Vercel.

## What was completed (Session 6 — Sprint 4.5: sealed pricing)

- **Sealed-product pricing built end-to-end + owner-verified.** Search "booster box" / "elite trainer box" /
  a set name → sealed results with a "Sealed" badge, a type label (Booster Box / ETB / Pack…), set, and market
  value; clicking adds a prize row pre-filled (`type = sealed`). Manual entry untouched.
- **New Supabase table `sealed_products`** (migration `20260606130000`, applied to remote; RLS public-read,
  service-role-only writes, pg_trgm index). **Populated with 1,848 sealed products** via `npx tsx
  scripts/sync-sealed.ts` (full sync ≈ 4.6s across 217 sets).
- **Empirically-validated sealed detection (Decision 032):** sealed = `extendedData` has no `Number` AND no
  `Rarity`. Probed live 1999→2026 (zero false positives). This *overruled* a Gemini suggestion to add a name
  keyword filter, which would have dropped real keyword-less sealed product.
- **One full-sync path** (script + nightly Vercel Cron share `lib/sealed/sync.ts`); `TcgCsvPriceSource` +
  `CompositePriceSource` (sealed first) behind the existing `PriceSource` interface — route unchanged.
- **Pre-flight all green:** typecheck ✅, lint ✅, **57/57 tests ✅** (8 new), build ✅.
- **Decision 032 logged.** Added `tsx` devDep.

## In progress

- Nothing actively coding. Sprint 4.5 is closed.

## Not started yet

- **Phase 5 — Launch:** UI/UX + accessibility polish; **deploy to Vercel**; custom domain; "not affiliated with
  Nintendo / The Pokémon Company" footer.
- **At Phase 5 deploy:** activate the sealed cron by setting `CRON_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` in the
  Vercel project's env vars (code + `vercel.json` already in place). Until deployed it's dormant; the local
  script refreshes the index on demand.
- **Deferred (Phase 3+):** public no-login share link for the odds sheet (share token + public-read path that
  still hides cost — do NOT relax RLS on `games`/`prize_items`).

## Blockers / open items

- **None blocking.** App runs with `npm run dev`; singles + sealed lookup both work against the live index.

## Gotchas / lessons

- **Sealed detection is field-absence, NOT keywords (Decision 032).** A product is sealed iff it has no
  `Number` AND no `Rarity` extended field. Don't add a name-keyword AND-filter — it drops keyword-less sealed
  product (e.g. "Collector Chest", "2-Player Starter Set"). Keywords only set the cosmetic type label.
- **`tsx` runs the sealed sync:** `npx tsx scripts/sync-sealed.ts` (`--dry` previews, `GROUPS=ID` scopes).
  `lib/sealed/*` use **relative** imports (not `@/`) so tsx resolves them without tsconfig-path config.
- **Never partial-column-upsert `sealed_products`** — NOT-NULL columns reject it; always upsert full rows
  (the reason there's one full-sync path, not a price-only one).
- **Sealed cron is dormant until the Phase 5 Vercel deploy** + its env vars; `/api/cron/sync-sealed` refuses to
  run with no `CRON_SECRET`.
- (Still true) **React 19/Next 16:** no synchronous `setState` in an effect body. **Card image hosts migrate**
  → host-agnostic `<img>` (Decision 030). **Search route cache/limit are in-memory only.**

## Immediate next actions

1. **Phase 5 — Launch:** a UI/UX + accessibility polish pass, then deploy to Vercel (the PokeHolder-style flow),
   add a custom domain, and a "not affiliated with Nintendo / The Pokémon Company" footer. At deploy, set the
   Vercel env vars to activate the sealed cron (see above).
2. **Optionally before launch:** the deferred public odds-sheet **share link** (Phase 3+) if the owner wants it
   in v1.
3. **Stay in-phase** — price lookup is done; don't expand it (graded has no free source and stays manual).

## Resume prompt for next session

```
MysteryCalc — Phases 1–4 are DONE and owner-verified. Phase 1 (calculator engine + UI), Phase 2 (Supabase auth
+ save/reuse, RLS), Phase 3 (Customer Odds Sheet — print/PDF), and Phase 4 (Price Lookup) are all built and
owner-verified. Price lookup is COMPLETE: SINGLES via pokemontcg.io (Sprint 4) + SEALED product via tcgcsv
(Sprint 4.5) — type a card OR a booster box / ETB / pack and its TCGPlayer market value auto-fills a prize row;
graded (PSA/BGS) stays manual (no free source). All pre-flight passes (typecheck / lint / 57 tests / build).
**NEXT UP: Phase 5 — Launch.**

WHAT MYSTERYCALC IS: a free Next.js web app for VENDORS to design & price mystery games (oripa, mystery boxes,
walls of sleeves, prize wheels, kuji, razz — the finite-pool family). Enter prizes (market value AND cost) →
pick a game type → set any two of {buy-in P, # chances N, target margin m} → solve the third → see profit three
ways, hit rate, prize-tier breakdown, break-even. Log in to SAVE games, PRINT a customer odds sheet, and LOOK
UP a card or sealed product's market value by name. Stack: Next.js 16 + TS + Tailwind v4 + shadcn + Supabase +
Vercel.

THIS SESSION = PHASE 5: LAUNCH. The remaining phase. Exit criterion: live at a real domain on Vercel, free.
Work: (1) a UI/UX + accessibility polish pass over the whole app; (2) deploy to Vercel (mirror PokeHolder's
flow — it's the sibling app); (3) custom domain; (4) a "Not affiliated with Nintendo / The Pokémon Company"
footer disclaimer (Decision 012). The product's working name is "MysteryCalc" — Decision 017 says pick the
final public name before launch (repo stays `mysterycalc`).

CRITICAL DEPLOY STEP — activate the sealed-pricing cron: the nightly sealed-price refresh
(/api/cron/sync-sealed + vercel.json daily cron) is wired but DORMANT until deploy. After deploying, set TWO
env vars in the Vercel project (Settings → Environment Variables): SUPABASE_SERVICE_ROLE_KEY (from Supabase →
Project Settings → API → service_role) and CRON_SECRET (any random string; generate with `openssl rand -hex
32`). Vercel sends CRON_SECRET to the cron automatically. Without them the cron refuses to run; until then the
sealed index is the local populate (refresh anytime with `npx tsx scripts/sync-sealed.ts`).

SEALED-PRICING CODE (Sprint 4.5, shipped): table migration supabase/migrations/20260606130000_sealed_products.sql
(RLS public-read, service-role writes, pg_trgm index); lib/sealed/classify.ts (isSealed = no Number AND no
Rarity — Decision 032; pure, tested) + db.ts (cookie-free admin/read clients) + sync.ts (syncSealed(), single
full-sync path ≈4.6s); scripts/sync-sealed.ts (npx tsx, populated 1,848 products across 217 sets);
app/api/cron/sync-sealed/route.ts + vercel.json (nightly, CRON_SECRET-gated); lib/prices/tcgcsv.ts
(TcgCsvPriceSource) + composite.ts (CompositePriceSource, sealed first) wired in lib/prices/index.ts;
CardSearch.tsx (Sealed badge) + Calculator.handleAddFromCard (type=sealed); tests/sealed-classify.test.ts (8).
PHASE 4 SINGLES CODE: see s4-price-lookup.md. PHASES 1–3 CODE: see MASTER_HANDOFF_01.md.

GOTCHAS: Sealed detection = FIELD-ABSENCE (no Number/no Rarity), NOT name keywords (Decision 032 — keywords
drop real sealed product like "Collector Chest"). `npx tsx scripts/sync-sealed.ts` refreshes the sealed index;
lib/sealed/* use RELATIVE imports (not @/) so tsx resolves them. NEVER partial-column-upsert sealed_products
(NOT-NULL columns reject it — one full-sync path only). React 19/Next 16 lint: no synchronous setState in an
effect body (derive at render). Card image hosts migrate (images.pokemontcg.io ↔ images.scrydex.com) — use a
host-agnostic <img>, not next/image (Decision 030). Search route cache + rate limit are IN-MEMORY only. Next
16: middleware→proxy (proxy.ts, Node runtime); NEVER trust the proxy for authz — server actions re-check the
user + RLS is the boundary. Stay on Vitest 3 (Decision 020). Secrets only in .env.local; never commit or expose
the service-role key.

SUPABASE: project ref txrlpwvmawwfuuzedfbw (https://txrlpwvmawwfuuzedfbw.supabase.co). Keys in gitignored
.env.local (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY + SUPABASE_SERVICE_ROLE_KEY, all set). CLI linked; `supabase db
push` applies migrations (init + sealed_products both applied to remote).

READ AT SESSION OPEN: docs/CLAUDE.md, docs/CURRENT_PHASE.md, docs/sprints/SPRINT_INDEX.md, the active phase's
sprint file(s), docs/modules/price-sources.md, and DECISIONS_LOG.md (001–032). Follow AGENTS.md (comment
standard for technical + semi-non-technical readers; append-only docs; stay in-phase; Next.js is newer than
training — check node_modules/next/dist/docs/).

AT SESSION CLOSE: follow docs/session-end-prompt.md line by line; update the sprint file + checklist +
SPRINT_INDEX; append DECISIONS + handoff; rewrite this file; commit + push to origin/main (Decision 019,
pre-authorized); end with the verbatim resume prompt.
```

---

*This file is REWRITTEN (not appended) at the end of every session.*
