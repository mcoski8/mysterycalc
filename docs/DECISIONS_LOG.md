# Decisions Log — MysteryCalc

> **Purpose:** Record every non-trivial decision so future sessions don't re-debate settled questions.
> **Format:** Question → Options → Choice → Why.
> **Rule:** Append only. Never edit or delete past entries. To change course, add a NEW decision that
> says "this amends/supersedes Decision NNN," and explain why. Reference decisions by number elsewhere.

---

## Decision 001 — Primary audience
**Date:** 2026-06-05
**Question:** Who is MysteryCalc built for first?
**Options:** Vendor-first | Both vendor + buyer from day one | Player-first
**Choice:** Vendor-first.
**Why:** Matches the owner's stated objective exactly — a tool for the person *running* a mystery game to design and price it. A buyer "should I play / live odds" mode is a possible future addition (the engine math supports it), but v1 surface area, features, and goals are all vendor-facing.

## Decision 002 — v1 game scope (the "finite-pool" family)
**Date:** 2026-06-05
**Question:** Which game formats does v1 support?
**Options:** Finite-pool family only | Add Live Box Breaks | Start narrower (just oripa + wall)
**Choice:** The finite-pool family — oripa, mystery box/pack/bag, wall of sleeves/prize wall, mystery slab lots, prize wheel/Plinko, kuji, and razz.
**Why:** They all run on a single shared math model (V, N, P, margin), so covering all of them is nearly free once the engine exists. Live Box Breaks are **deferred** (prizes are random sealed contents the vendor doesn't control → needs a separate cost-and-pull-value model). Claw/UFO catcher is **out** (per-play programmed payout, no fixed pool). See `docs/research/japanese-vs-american-mystery-games.md`.

## Decision 003 — Platform & stack
**Date:** 2026-06-05
**Question:** What is MysteryCalc built as, and where is it used?
**Options:** Web app (desk-planner, mobile-friendly) | Phone-first app | Spreadsheet/desktop tool
**Choice:** A **Next.js + TypeScript web app**, desk-planner first, mobile-friendly in the browser. Same stack as PokeHolder (Tailwind + shadcn/ui, Supabase, Vercel).
**Why:** Planning a game happens at a desk before an event; a web app serves that and still works on a phone at the table. Reusing the PokeHolder stack reuses hard-won setup (auth, deploy, price-lookup learnings) and keeps the owner on familiar ground.

## Decision 004 — Track both market value and cost
**Date:** 2026-06-05
**Question:** Should prize items carry just market value, or also the vendor's cost?
**Options:** Both market + cost | Market value only
**Choice:** Both. Each item has a **market value** and the vendor's **cost**.
**Why:** They answer different questions. Market value drives the *advertised* pool size and the *player's* odds/EV (what the game looks worth); cost drives the vendor's *true profit* (revenue − total cost). Showing only market value would hide whether a game actually makes money.

## Decision 005 — Show the vendor's "cut" three ways
**Date:** 2026-06-05
**Question:** Which single number should the tool lead with for the vendor's take?
**Options:** Percent kept | Dollars of profit | Pool multiple | All three
**Choice:** All three — % kept (margin), dollars of profit (uses cost), and pool multiple (revenue ÷ pool). User toggles which one leads.
**Why:** Owner explicitly wants all three available ("any of the above would be nice to have"). Different vendors think in different terms, and the same game outcome reads naturally in each.

## Decision 006 — Manual value entry first; price lookup later
**Date:** 2026-06-05
**Question:** Where do prize values come from?
**Options:** Manual now, lookup later | Manual only | Automatic lookup from v1
**Choice:** Manual entry for v1, behind a **pluggable price-source interface** so automatic lookup (pokemontcg.io / TCGPlayer) can drop in later without a rewrite.
**Why:** Manual unblocks a usable calculator immediately; lookup is real engineering (rate limits, matching, caching) better done as its own phase. The interface keeps the door open cheaply. Reuses PokeHolder's `price-engine` experience.

## Decision 007 — Customer-facing odds sheet in v1
**Date:** 2026-06-05
**Question:** Should the tool generate a customer-facing odds sheet, or be calculator-only?
**Options:** Include odds sheet | Calculator-only for now
**Choice:** Include a printable/shareable odds sheet (its own phase, Phase 3).
**Why:** It's the Japanese "remaining cards / here are the odds" transparency edge, it builds player trust, and the engine already computes everything it needs (per-prize odds = quantity ÷ N). High value, low marginal cost.

## Decision 008 — Saved, reusable game setups (needs accounts)
**Date:** 2026-06-05
**Question:** Save/reuse game setups, or a pure on-the-spot calculator?
**Options:** Save & reuse (login + storage) | Calculate on the spot only
**Choice:** Save & reuse — Supabase auth + storage (Phase 2). The core calculator still works with no login (Phase 1).
**Why:** Owner wants to revisit, duplicate, and tweak games across events. Keeping the Phase 1 calculator login-free means the tool is useful before accounts exist; saving is the thing that requires an account.

## Decision 009 — Filler items + auto-balance to N
**Date:** 2026-06-05
**Question:** How are "every chance wins" games kept internally consistent?
**Options:** Make the vendor manually ensure prize count = chances | Tool auto-balances with filler
**Choice:** The tool lets the vendor bulk-add **filler** ("the other 95 sleeves each hold a $4 pack") and **auto-balances** so the total prize count always equals N.
**Why:** In oripa/wall/wheel/kuji/slab-lots every chance yields exactly one prize, so Σ(quantities) must equal N. Forcing the vendor to hand-balance this is error-prone; auto-balancing is the central usability win. (Razz is exempt — 1 prize, N chances.)

## Decision 010 — Output game "feel," not just margin
**Date:** 2026-06-05
**Question:** Is margin enough, or does the tool need to describe the player experience?
**Options:** Margin only | Add hit rate + prize-tier breakdown + volatility
**Choice:** Add **hit rate** (% of chances worth ≥ buy-in), a **prize-tier breakdown** (chase/win/dud buckets), and a simple **volatility** read.
**Why:** Gemini's key design point: two games with identical margins can feel completely different (one $600 chase + 95 duds vs. everything ~$12). That difference is what sells chances and what a vendor is really tuning. This turns a margin calculator into a game-design tool.

## Decision 011 — Sell-through / break-even indicator in v1 (PENDING owner confirm)
**Date:** 2026-06-05
**Question:** Does v1 model the risk of a game not selling out?
**Options:** Include a break-even indicator | Assume full sellout for v1
**Choice:** **Proposed:** include a simple "break even once X of N chances sell" indicator. **Status: pending owner confirmation** (flagged in `docs/PROPOSAL.md` §10 Q1 as cuttable).
**Why:** Revenue assumes sellout, but in a pre-placed-prize game the vendor keeps unsold sleeves and their prizes — real risk hinges on whether the chase sold. A break-even read is cheap insight. Marked pending because it's a slightly larger feature the owner may defer.

## Decision 012 — Neutral, transparency-leaning tone
**Date:** 2026-06-05
**Question:** How does MysteryCalc position itself in a gambling-adjacent space?
**Options:** Neutral game-economics tool | "Maximize what you extract" framing
**Choice:** Neutral **game-economics planning tool**, leaning toward fair/disclosed games (the odds sheet, honest hit-rate). A "not affiliated with Nintendo/TPC" footer disclaimer is the only legal nod. No gambling facilitation, payments, or game-running.
**Why:** The space is sensitive. A neutral, transparency-forward posture is both more defensible and more useful, and the owner agreed.

## Decision 013 — Documentation system mirrors PokeSentry / PokeHolder
**Date:** 2026-06-05
**Question:** What documentation/workflow system does this project use?
**Options:** Invent a new one | Mirror the owner's existing PokeSentry/PokeHolder system
**Choice:** Mirror it exactly — `docs/CLAUDE.md` master context, append-only `DECISIONS_LOG.md`, per-session `handoff/`, `sprints/` with task tables + session logs, `CURRENT_PHASE.md` rewritten each session, and the `session-end-prompt.md` ritual. Plus the `PROPOSAL.md` sign-off gate from PokeHolder.
**Why:** It's proven across 120+ sessions on the owner's other projects, the owner navigates by it, and consistency means every future session starts smoothly. Documented in `PROCESS.md`.

## Decision 014 — Sell-through / break-even indicator: ADOPTED for v1
**Date:** 2026-06-05
**Question:** Does v1 include the break-even / sell-through indicator? (Confirms the pending Decision 011.)
**Options:** Include in v1 | Defer
**Choice:** **Include in v1.** This confirms Decision 011 — status changes from PENDING to ADOPTED.
**Why:** The owner confirmed. The engine shows "you break even once X of N chances sell" (`breakEvenChances = ceil(C / P)`), giving a cheap, important read on risk when a game may not fully sell out. See `docs/modules/calculation-engine.md`.

## Decision 015 — Typical game size: tens to a few hundred chances
**Date:** 2026-06-05
**Question:** Roughly how many prizes/chances does a typical game have? (Drives input UX + performance.)
**Options:** Tens (~10–50) | Hundreds (~50–500) | ~1,000+ | Varies widely
**Choice:** **Tens AND hundreds (~10–500)** — owner answered "1 and 2 probably." Design the prize-pool input for this range with strong **bulk-add filler**; ~1,000 is not the primary target but the app should degrade gracefully if a vendor goes large.
**Why:** Sets the design center for the input screen (per-item entry must be quick at the low end; bulk filler tools essential by the mid-hundreds). Avoids over-engineering for a 1,000-row case that isn't the norm, while not breaking on it.

## Decision 016 — Razz / raffle retained in v1
**Date:** 2026-06-05
**Question:** Keep the single-winner razz/raffle format in v1 given its US legal sensitivity? (Refines Decision 002.)
**Options:** Keep | Drop from v1
**Choice:** **Keep it.** The customer odds sheet will clearly mark its single-winner nature.
**Why:** It reuses the same margin formula (1 prize, N chances), so inclusion is nearly free. The legal sensitivity is the *vendor's* operating concern, not the calculator's — MysteryCalc only does math and disclosure (neutral-tool posture, Decision 012). Transparency (explicit single-winner labeling on the odds sheet) is the right response, not omission.

## Decision 017 — "MysteryCalc" is a working codename; final public name deferred
**Date:** 2026-06-05
**Question:** Is "MysteryCalc" the final public name?
**Options:** Final | Working codename (decide later) | A different name
**Choice:** **Working codename.** Keep building as "MysteryCalc"; pick the final public name before launch (Phase 5). The repo folder stays `mysterycalc` regardless.
**Why:** No need to lock branding now; deferring avoids rework if a better name emerges. UI copy should keep the product name in one place (easy to swap later).

## Decision 018 — PROPOSAL signed off; Phase 0 complete
**Date:** 2026-06-05
**Question:** Is `docs/PROPOSAL.md` approved, and are there any remaining changes before it's locked?
**Options:** Lock as-is | Request changes
**Choice:** **Lock as-is.** Owner said "lock it." All five §10 open items resolved (Decisions 014–017 + no further changes). `docs/PROPOSAL.md` status → SIGNED OFF. **Phase 0 (Planning & Docs) exit gate is met; Phase 1 (Core Calculator) is cleared to begin.**
**Why:** The proposal captured the full product + technical architecture and the owner reviewed it (via the plain-text summary) and approved it with no changes. Per the project's phase discipline (Decision 013 / `PROCESS.md`), application code may now begin — starting with scaffolding the Next.js app and building the pure calculation engine in `lib/` first, per `docs/sprints/s1-core-calculator.md`.

## Decision 019 — GitHub remote + mandatory commit-and-push every session
**Date:** 2026-06-05
**Question:** Where does the repo live, and what is the commit/push cadence?
**Options:** Local only | Push on request | Commit + push to origin/main every session (auto)
**Choice:** Remote = **`https://github.com/mcoski8/mysterycalc`** (origin/main). **Commit + push to origin/main is MANDATORY at every session close, pre-authorized — attempt the push without asking.**
**Why:** The owner enabled this to match their other projects (PokeSentry, PokeHolder, TrendRadar, Taiwanese). It guarantees nothing is lost between sessions and the remote is always current. Encoded in `docs/session-end-prompt.md` (Pre-Flight → Always → step 3). A sandbox/network block on a push is not the owner reconsidering — report and continue.

## Decision 020 — Realized Phase 1 tech stack + the Vitest UI advisory call
**Date:** 2026-06-05
**Question:** What exact tooling/versions does the Sprint 1 build land on, and how do we handle the Vitest security advisory?
**Options:** (a) Pin the versions create-next-app + shadcn chose and stay on Vitest 3 | (b) Force-upgrade to Vitest 4 to clear the audit warning
**Choice:** **(a).** Stack: **Next.js 16.2.7** (Turbopack is the default build/dev engine in 16; `next lint` is removed → `lint` script is `eslint .`), **React 19.2.4**, **Tailwind v4** (CSS-config), **shadcn/ui** (Nova preset, radix base), **Vitest 3.2.6**. Stay on Vitest 3.
**Why:** This is the realized form of Decision 003 (the PokeHolder-style stack), now version-pinned. The npm-audit "critical" (GHSA-5xrq-8626-4rwp) affects **only** the Vitest **UI server** (`vitest --ui`), which we never run — our scripts use `vitest run`. It is not a runtime/production exposure. The fix is a breaking Vitest 4 bump that isn't worth the churn for a feature we don't use. Revisit only if we ever add `vitest --ui`. Implements: Phase 1 scaffold (see `s1-core-calculator.md`).

## Decision 021 — Solve-for treats pool value V as a fixed constant (no silent filler rebalance)
**Date:** 2026-06-05
**Question:** When the engine solves for the number of chances N, should it recompute filler (which would change V, which would change the N it needs — a circular loop), or hold V fixed?
**Options:** (a) Hold V fixed at the current pool's value; warn if the solved N ≠ the listed prize count | (b) Iteratively rebalance filler to the solved N
**Choice:** **(a).** `solveGame` takes V = Σ(marketValue × qty) of the pool exactly as listed and treats it as a constant while solving. If the solved N differs from the listed prize count (every-chance-wins games), it emits a **warning** ("add filler to reach N for accurate odds"), it does not silently rebalance.
**Why:** It matches the official worked example exactly — V=$1,180 stays $1,180 while N is solved to 91, even though the seeded pool holds 100 prizes. Option (b) is circular (adding filler raises V, which raises the N needed, …) and would diverge from the documented acceptance test. Honest warnings beat a hidden feedback loop. The UI's "Balance filler to N" button is the explicit, user-driven way to make prize count = N. See `docs/modules/calculation-engine.md`.

## Decision 022 — Razz modeling: one winner takes the whole listed pool; losers are implicit $0 spots
**Date:** 2026-06-05
**Question:** For razz (single-winner), how is the prize and the player experience modeled when the vendor may list more than one item?
**Options:** (a) The single winner takes the ENTIRE listed pool (V = Σ of all listed items); the other N−1 spots are implicit "no-prize" $0 chances | (b) Require razz pools to contain exactly one item
**Choice:** **(a).** For razz the engine sets the winning value = `poolValue(items)` (the whole listed pool, so a vendor can bundle "slab + ETB" as one grand prize) with count 1, and synthesizes **N−1 implicit $0 "No prize" spots** for hit-rate, tier, volatility, and odds. A "No prize / (N−1)/N" line appears in the per-prize odds. The margin formula `m = 1 − V/(N×P)` is unchanged.
**Why:** It keeps razz on the same single math model (Decision 002) while supporting real-world bundled raffle prizes, and it makes the single-winner structure explicit on the (future) odds sheet (Decision 016's transparency requirement). The implicit $0 spots are what make razz correctly read as 1% hit rate / high volatility / "1 in N" odds without storing dummy pool rows.

## Decision 023 — Login method: email + password
**Date:** 2026-06-05
**Question:** How do vendors log in (Phase 2)? The calculator stays usable logged-out; this only gates saving.
**Options:** (a) Email + password | (b) Magic link (passwordless email link) | (c) "Sign in with Google" (OAuth)
**Choice:** **(a) Email + password.** (Owner chose this when asked.)
**Why:** It's self-contained and reliable — it works the instant the Supabase project exists, with no dependency on email deliverability (the owner has hit magic-link email breakage before) and no external Google Cloud OAuth setup (fiddly, and redirect config breaks between localhost and production). It's the most dependable path to meeting the Phase 2 exit gate. "Sign in with Google" can be added later as a polish pass without reworking the saved-games layer. Implemented in `app/login/*` + `lib/supabase/*`.

## Decision 024 — Phase 2 auth architecture (@supabase/ssr + Next.js 16 Proxy + server-action/RLS enforcement)
**Date:** 2026-06-05
**Question:** How is Supabase auth wired into a Next.js **16** App Router app, and where is access actually enforced?
**Options:** (a) `@supabase/ssr` cookie clients + a root `proxy.ts` for session refresh, with auth enforced inside each server action and by database RLS | (b) the deprecated `@supabase/auth-helpers` + a `middleware.ts` that gates routes
**Choice:** **(a).** Browser client (`createBrowserClient`) + cookie-aware server client (`createServerClient`, async `cookies()`). Session refresh runs in **`proxy.ts`** — Next.js 16 **renamed the `middleware` file convention to `proxy`** (function `proxy`, Node runtime, matcher excludes static assets). The proxy ONLY refreshes the cookie; **authorization is enforced inside every server action (re-checks `auth.getUser()`) and by row-level security**, never by the proxy alone. Plus graceful degradation: `lib/supabase/configured.ts` short-circuits all Supabase entry points when env vars are absent so the Phase 1 calculator never crashes pre-configuration.
**Why:** `@supabase/ssr` is the current, non-deprecated pattern. The Next.js 16 docs explicitly warn that a proxy matcher change can silently drop coverage of server functions, so relying on the proxy for authz is unsafe — RLS + per-action checks are the real boundary (and were verified live, see D-026). Graceful degradation honors Decision 008 (calculator works with no account). Files: `lib/supabase/{client,server,proxy,configured}.ts`, root `proxy.ts`.

## Decision 025 — Saved-games schema & serialization rules
**Date:** 2026-06-05
**Question:** Exactly how is a calculator state stored, and how do we avoid the three-knob "drift" the schema doc warned about?
**Options:** (a) Store all three of {buy_in, chances, target_margin} | (b) Store only the two the vendor fixed, NULL the solved one, record `solve_for`, and recompute the third on load
**Choice:** **(b).** `games` stores `game_type`, `solve_for`, the two fixed knobs (the solved one is NULL), `lead_metric`, timestamps; `prize_items` stores name/type/market_value/cost/quantity/is_filler/`position`. A DB **CHECK constraint enforces that the solved-for knob is NULL** (the no-drift rule). Margin is stored as a fraction (0.35) and converted to/from the UI percent ("35"). `position` preserves prize-row order. The lead-metric toggle was lifted from `ResultsDashboard` into `Calculator` state so it persists with a game (its internal key `"margin"` was renamed `"percent"` to match the DB/`LeadMetric` type). Pure translation lives in `lib/saved-games/serialize.ts` (unit-tested); CRUD in `lib/saved-games/actions.ts`.
**Why:** Storing the solved knob would let a stored number drift from what the engine recomputes; nulling it + the CHECK makes drift impossible at the database level (this implements the GOTCHA in `docs/modules/database-schema.md`). Keeping serialization pure makes it testable without React or the network (6 tests, incl. a save→load round-trip).

## Decision 026 — Live Supabase provisioning + verification record
**Date:** 2026-06-05
**Question:** Record the realized Phase 2 infrastructure and how it was verified.
**Choice:** Supabase project **`txrlpwvmawwfuuzedfbw`** (`https://txrlpwvmawwfuuzedfbw.supabase.co`), in the owner's existing org. The migration was applied with `supabase link` + `supabase db push` (the CLI was already authenticated and had DB access). The **anon legacy JWT key** is in use as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (verified working); a new-style `sb_publishable_…` key is recorded as a commented fallback in `.env.local`. The full data path + RLS were **verified end-to-end against the live database** via a service-role/anon harness (insert as A, RLS-blocked reads/inserts as B, CHECK rejection), then the test users were deleted. **Email confirmation was left at the Supabase default** (likely ON) — the app handles it via `/auth/confirm`; turning it OFF (one dashboard toggle) is an optional smoothness improvement left to the owner. Secrets live only in gitignored `.env.local`; `.env.example` is the committed template.
**Why:** Captures the concrete environment + the evidence that RLS and the schema actually work, so a future session doesn't re-verify from scratch. The keychain-stored CLI access token was intentionally NOT extracted (a guard blocked scanning it), so the email-confirmation toggle was not flipped programmatically — documented as a one-click owner step instead.

## Decision 027 — Phase 3 scope: print/PDF odds sheet first; public share link deferred
**Date:** 2026-06-06
**Question:** The Phase 3 gate says "printable **or** shareable." Which do we build first?
**Options:** (a) Print/PDF view first (vendor prints/saves a PDF from their logged-in browser), add a public share link later | (b) Build both the print view and a public no-login share link now | (c) Public share link only (rely on the browser's print of the shareable page)
**Choice:** **(a).** Ship a print-optimized odds sheet rendered from a *saved* game, reachable from "My games," printed/saved-as-PDF via the browser. A public, no-login **share link is deferred to Phase 3+** and logged as a follow-on.
**Why:** The print/PDF path meets the Phase 3 exit criterion, is the simplest thing that's genuinely useful (a vendor posts/hands out a sheet), and **adds no new security surface**. A public share link is meaningfully more work and risk: it needs a share token and a careful public-read path that still keeps cost/profit private — the `games`/`prize_items` rows contain cost, so it must NOT be done by relaxing RLS on those tables. Owner chose (a) on 2026-06-06.

## Decision 028 — Odds-sheet architecture: pure builder + a test-enforced customer-safe boundary
**Date:** 2026-06-06
**Question:** How is the customer odds sheet derived, and how do we guarantee it never leaks the vendor's cost/profit/margin?
**Options:** (a) A pure builder that runs the existing engine and emits a customer-only view-model (no cost/profit fields built at all), guarded by a test | (b) Render the sheet directly from the full `GameResult` in the component and rely on the JSX to "just not show" cost/profit
**Choice:** **(a).** `lib/odds-sheet/build.ts#buildOddsSheet(snapshot, name)` produces an `OddsSheet` view-model containing only customer-safe fields (game name/type, buy-in, chances, pool *market* value, hit rate, and per-prize {name, quantity, marketValue, probability}). It reuses the engine's `perPrizeOdds` (no new math) and a new pure `snapshotToSolveInput` helper. `tests/odds-sheet.test.ts` asserts the result has no cost/profit/margin key and that prize-cost values never appear in the serialized sheet. The route (`app/games/[id]/odds/page.tsx`) is auth-gated and RLS-protected; the `OddsSheetView` client component only ever receives the safe view-model.
**Why:** Building a dedicated narrow shape (rather than passing the full `GameResult` to the view) makes "no vendor secrets on the customer sheet" a structural guarantee, not a styling choice that a future edit could undo. The test makes the hard rule a regression-proof invariant. Keeping the builder pure mirrors the engine's design and keeps it trivially testable.

## Decision 029 — Realized price-source interface returns candidate cards, not a single value
**Date:** 2026-06-06
**Question:** The Phase 4 spec sketched `PriceSource.getMarketValue(query) → number | null`. Is that the right shape once we build real card lookup?
**Options:** (a) Keep `getMarketValue → number` (one query, one value) | (b) `search(query) → PriceCandidate[]` (a list of matching cards, each with its own value)
**Choice:** **(b).** `PriceSource.search(query)` returns an array of `PriceCandidate` (id, name, set, number, rarity, image, marketValue|null, priceLabel, pricesUpdatedAt). `ManualPriceSource.search` returns `[]`.
**Why:** A card name like "Charizard" matches hundreds of printings at wildly different values — lookup is fundamentally a *disambiguation* problem, so the vendor must SEE candidates and pick the right printing. A single-value interface couldn't express that. The spirit of Decision 006 is unchanged: it's still one pluggable interface with manual as the guaranteed fallback; only the method shape is richer. The pure picking logic (which variant/field) lives in `lib/prices/extract.ts` and is unit-tested independently of the network.

## Decision 030 — Card thumbnails use a host-agnostic `<img>`, not `next/image`
**Date:** 2026-06-06
**Question:** How do we render card thumbnails in the price-lookup picker, given the image host varies?
**Options:** (a) `next/image` with the image host(s) allow-listed in `next.config.ts` | (b) a plain `<img>` for the thumbnails
**Choice:** **(b).** Use a plain `<img>` (with `loading="lazy"`) for the small external thumbnails; one `eslint-disable-next-line @next/next/no-img-element` with a FRAGILE comment. Reverted the `next.config.ts` `images.remotePatterns` entry.
**Why:** `next/image` blocks any remote host not explicitly allow-listed, and the pricing API's image CDN **migrates** — older cards serve from `images.pokemontcg.io`, newer ones from `images.scrydex.com` (pokemontcg.io is now run by Scrydex). The owner's browser hit a hard runtime crash on a scrydex-hosted image. Chasing an ever-changing allow-list is fragile for tiny decorative thumbnails; a plain `<img>` is host-agnostic and robust. (Surfaced by the owner's visual check — data-only tests couldn't catch a client-side image-host error.)

## Decision 031 — Adopt tcgcsv as the free sealed-product price source; build it in its own sprint
**Date:** 2026-06-06
**Question:** pokemontcg.io has no sealed-product (booster box/ETB/pack) prices, which mystery games use heavily. PokeHolder uses a second free source, tcgcsv.com — does it carry sealed, and do we add it now or later?
**Options:** (a) Defer sealed; ship today's singles lookup, adopt tcgcsv-for-sealed as a planned next sprint | (b) Expand Phase 4 now to add tcgcsv sealed pricing
**Choice:** **(a).** **tcgcsv.com IS confirmed to carry sealed product with live market prices** (verified against set "Perfect Order": Booster Box $222.34, ETB $76.31, Pokémon Center ETB $142.52, Booster Bundle $40.34, Booster Pack $5.91, etc. — 31 sealed products in that set alone). It is free, key-less, relays TCGPlayer's full catalog, refreshes ~daily (wants a polite User-Agent). We **adopt it** as the sealed source but **defer the build to its own dedicated sprint.** Owner chose (a) on 2026-06-06.
**Why:** Sealed prizes (ETBs, boxes, packs) are core to mystery games — the worked example itself uses an ETB and packs — so auto-pricing them is high value. But tcgcsv is a **bulk catalog, not a search-by-name API**, so making sealed searchable needs a small **nightly sync/index into Supabase** (mirroring PokeHolder's `scripts/sync-tcgcsv.mjs`) — real, deliberate infrastructure, not a quick add. Shipping today's working singles lookup now and tackling sealed as a focused sprint keeps each piece clean and in-phase. Graded (PSA/BGS/CGC) stays manual — it's not in TCGPlayer's catalog, so there's no free source for it. The pluggable `PriceSource` interface (Decision 029) means tcgcsv drops in as another source without reworking the UI or calculator.

## Decision 032 — Realized sealed-pricing design: field-absence detection, one full-sync path, composite source
**Date:** 2026-06-06
**Question:** Implementing Decision 031, three sub-questions had to be settled empirically: (1) how do we reliably tell SEALED product from singles in the tcgcsv catalog across 217 sets spanning 1999–2026? (2) should the nightly sync be split into a heavy "discover products" pass + a light "refresh prices" pass to respect Vercel Hobby's 60s function cap (as a Gemini consult suggested)? (3) how do sealed + single results combine in one search?
**Options:** (1a) field-absence: sealed = `extendedData` has no `Number` AND no `Rarity` · (1b) field-absence AND a name keyword (box/pack/etb…) to "confirm" · (2a) one full sync used by both script + cron · (2b) split discover/refresh modes · (3a) a `CompositePriceSource` running both sources in parallel, sealed first · (3b) the route calls each source and merges.
**Choice:** **(1a) + (2a) + (3a).**
- **Detection = field-absence only.** Probed live: singles always carry `Number`; digital Code Cards carry `Rarity` but no `Number`; sealed carries neither. Across Base Set (1999) → 2026, incl. Jumbo Cards (333 products) and promo sets (283), it produced **zero** false positives. **Rejected (1b):** the keyword AND-filter would have wrongly dropped real sealed items with no obvious keyword — "Pokemon 2-Player Starter Set" and "Celebrations Collector Chest" (both have only `CardText`). So field-absence is the GATE; keywords only derive the cosmetic `product_type` label (with an "Other" catch-all that keeps unmatched product searchable).
- **One full-sync path.** The full sync (all 217 sets, 2 small downloads each) measured **4.6s** — far under the 60s cap — so the split (2b) buys nothing and adds complexity. A partial-column "prices-only" upsert also can't satisfy the table's NOT-NULL columns (`name`, `group_id`), which a single full-row upsert sidesteps. The same `syncSealed()` runs from the local `tsx` script (initial populate / on-demand) and the nightly Vercel Cron.
- **Composite source.** `CompositePriceSource([tcgcsv, pokemontcg])` searches both in parallel and concatenates, sealed first (mystery prizes are heavily sealed). A failing source contributes nothing rather than breaking the search. The `/api/prices/search` route is unchanged — it still asks one `getActivePriceSource()`.
**Why:** Empirical testing (the owner's "test before preemptive setup" rule) overruled a plausible-but-wrong consultant suggestion and a premature optimization. The result is simpler AND more correct: one sync path, a detection rule proven across the whole catalog, and a composite that drops behind the existing interface (Decision 029) with no UI/route rework. Realized in: migration `20260606130000_sealed_products.sql`; `lib/sealed/{classify,db,sync}.ts`; `scripts/sync-sealed.ts`; `app/api/cron/sync-sealed/route.ts` + `vercel.json`; `lib/prices/{tcgcsv,composite,index,types,extract}.ts`; `components/calculator/{CardSearch,Calculator}.tsx`. **Deferred:** the Vercel Cron only runs after Phase 5 deploy (needs `CRON_SECRET` + service-role key in the Vercel dashboard); until then the local script keeps the index fresh.

## Decision 033 — Final public name is "MysteryCalc" (confirms Decision 017)
**Date:** 2026-06-06
**Question:** Decision 017 deferred the final public name to launch (Phase 5). What is it?
**Options:** Keep "MysteryCalc" | "MysteryMargin" | "OripaCalc" | another name
**Choice:** **Keep "MysteryCalc."** The working codename becomes the final public name. This confirms Decision 017 (status: deferred → resolved). The repo folder stays `mysterycalc`.
**Why:** The owner chose it at launch. It's clear and descriptive (it says exactly what it is — a calculator for mystery games), it's already the centralized `APP_NAME` in `lib/brand.ts` so there was zero rework, and the alternatives were either more generic-brandable with no real upside ("MysteryMargin") or too narrow ("OripaCalc" implies only oripa, but the tool also covers walls, wheels, kuji, razz). The name lives in exactly one file, so a rebrand later is still a one-line change if a better name ever emerges.

## Decision 034 — Launch realized: free `.vercel.app` domain, Vercel Hobby, git-connected auto-deploy
**Date:** 2026-06-06
**Question:** Record the realized Phase 5 launch — where the app is hosted, on what domain, and how deploys happen.
**Options (domain):** (a) Free Vercel subdomain (`mysterycalc.vercel.app`) | (b) Buy a custom domain (~$10–15/yr) and point DNS at Vercel
**Choice:** **(a) — free `.vercel.app` subdomain.** The app is live at **https://mysterycalc.vercel.app** on the Vercel **Hobby (free)** plan, project `michaels-projects-eace96e9/mysterycalc`, with the **GitHub repo connected for auto-deploy** (every push to `origin/main` redeploys production — matching the session-end push discipline, Decision 019). A custom domain is **deferred** (can be added anytime via the Vercel dashboard with no code change; `NEXT_PUBLIC_SITE_URL` is the override hook).
**Why:** Phase 5's exit criterion is "live at a real domain on Vercel, **free**" — a `.vercel.app` subdomain satisfies it exactly, mirrors the sibling app PokeHolder (`pokeholder-three.vercel.app`), costs nothing, and was instant. The owner chose the free path. **Realized at deploy:** production + development env vars set in Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`); a freshly generated `CRON_SECRET` set in production, which **activated the nightly sealed-price cron** (`/api/cron/sync-sealed`, daily 09:00 UTC — verified returning HTTP 401 without the secret, exactly as designed). **Preview-environment env vars were NOT set** — a Vercel CLI v54.6.1 quirk rejected the non-interactive "all Preview branches" path (`git_branch_required` even with `--value --yes`); not needed for the production launch, addable via the dashboard later. **Accessibility/SEO polish shipped this session:** app-wide `SiteFooter` (the Decision 012 disclaimer now on every page via the root layout, `no-print`), `<main>` landmarks + a skip-to-content link on all pages, and enriched metadata (OpenGraph/Twitter/robots/theme-color, `metadataBase` from the Vercel URL). Files: `components/SiteFooter.tsx`, `app/layout.tsx`, `app/page.tsx`, `app/login/page.tsx`, `app/games/[id]/odds/page.tsx`, `components/odds-sheet/OddsSheetView.tsx`.

## Decision 035 — Post-launch UX overhaul + dark mode (adds `next-themes`)
**Date:** 2026-06-07
**Question:** The launched app used the default grayscale shadcn theme and looked rudimentary. Give it a cohesive, beautiful identity — and add a dark mode — without a rebuild.
**Options:** (a) Tweak a few colors | (b) Build a real design-token system + display font + dark mode | (c) Dark mode via a hand-rolled pre-hydration script vs. the `next-themes` dependency
**Choice:** **(b) full design system + (c) `next-themes`.** A cohesive **violet + gold "premium mystery box"** palette in OKLCH (light AND dark), a fixed latent bug where `--font-sans` was self-referential (Geist never actually applied), the **Space Grotesk** display font, an aurora background glow, gradient wordmark/logo-mark/step-badges/lead-tile. **Dark mode via `next-themes`** (`attribute="class"`, `defaultTheme="system"`, `enableSystem`) — chosen over a hand-rolled script because it's the low-maintenance, no-FOUC standard and the owner is non-technical; toggle in the header + footer; `<html suppressHydrationWarning>`.
**Why:** Token-driven theming cascades to every shadcn component at once; OKLCH keeps the violet→gold ramp perceptually even; `next-themes` is free/OSS, tested, and "set-and-forget." Gemini (gemini-2.5-pro, via `pal`) concurred on `next-themes` over a custom script. Files: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/login/page.tsx`, `components/theme/ThemeProvider.tsx`, `components/theme/ThemeToggle.tsx`, `components/SiteFooter.tsx`. Also shipped this session: a `/guide` field-guide page (`app/guide/page.tsx`) explaining every JP/US mystery format, and a responsive mobile pass (prize editor + odds table become stacked cards below `sm`; fixed a real ≤390px header overflow — CDP-measured).

## Decision 036 — Profit goal expressible as margin %, $ profit, or × multiple
**Date:** 2026-06-07
**Question:** A vendor asked "why can't I set a 100%+ margin / triple my money?" Margin is a share of revenue (capped <100% by definition). Let vendors state the goal the way they think.
**Options:** (a) Only margin % (status quo) | (b) Add a unit toggle: margin % / total $ profit / money multiple (×) | (c) Add new engine solve-for modes
**Choice:** **(b).** The "Target margin" knob became a **"Profit goal"** with a %/$/× toggle. A pure, tested helper (`lib/games/goal.ts`) converts any unit to the engine's margin fraction (profit: `m = 1 − V/(C+profit)`; multiple: `m = 1 − 1/k`), so the **engine and the saved-games DB shape are unchanged** — the conversion lives in the UI layer with the live pool totals.
**Why:** "Triple my money" = a 3× multiple = ~66.7% margin; surfacing $ and × answers the confusion without touching the proven engine. Round-trip tested ($1,500 goal → exactly $1,500 profit). GOTCHA: the chosen unit isn't persisted — a reopened saved game shows its goal as a margin % (identical economics, no migration). Files: `lib/games/goal.ts`, `components/calculator/SolverPanel.tsx`, `components/calculator/Calculator.tsx`, `tests/goal.test.ts`.

## Decision 037 — Search: rank by relevance across sources + match the set name
**Date:** 2026-06-07
**Question:** The card/sealed search capped at ~12 results, couldn't scroll past them, ranked weakly, and only matched the card title (so "charizard paldean" found no singles — "paldean" is the set).
**Options:** (a) Just raise the caps | (b) Raise caps + add relevance ranking + match the set name
**Choice:** **(b).** Caps raised (singles 12→40, sealed 12→30, fetch-80-then-trim); a pure tested relevance scorer (`lib/prices/relevance.ts`: exact > prefix > whole-query > per-word with a word-start bonus, shorter-name tiebreak) used by **both sources AND the composite**, which now **merges best-match-first across singles+sealed** instead of concatenating sealed-then-singles. Each word matches the card name **OR** the set name (singles via `(name:*w* OR set.name:*w*)`; sealed via PostgREST `.or(name,set_name)`), with set matches weighted below name matches.
**Why:** A vendor searches by what they remember (often the set). Ranking across sources stops an exact single hiding under loosely-matching sealed bundles. Verified live: "charizard paldean" now returns the Paldean-Fates Charizard singles. Files: `lib/prices/relevance.ts`, `lib/prices/pokemontcg.ts`, `lib/prices/tcgcsv.ts`, `lib/prices/composite.ts`, `components/calculator/CardSearch.tsx`, `tests/relevance.test.ts`.

## Decision 038 — Live Game Board: new feature + real-time architecture
**Date:** 2026-06-07
**Question:** The owner wants a customer-facing iPad "scoreboard" for a running game — what's left, live odds, recent wins — that updates in real time as the vendor taps wins on their phone. What architecture, on the free Vercel+Supabase stack, with a non-technical owner and flaky convention WiFi? (New scope beyond the launched phases.)
**Options (sync):** (a) Supabase Realtime `broadcast` (ephemeral) | (b) Supabase Realtime `postgres_changes` (DB-backed) | (c) polling | (d) WebRTC/BroadcastChannel.
**Choice:** **(b) `postgres_changes`** — the DB is the single source of truth, so a reloaded iPad or a WiFi blip self-heals by re-reading the row. Pairing is **secure by design (owner's hard requirement): the vendor's PHONE creates and controls the board and holds the secret control token locally — it is NEVER shown on any screen.** The iPad is a **read-only display** joined by a short code (a public "scan to watch" QR is fine, since it grants view-only). **Data model = two tables:** `live_games` (PUBLIC + realtime, no secret) and `live_game_secrets` (the SHA-256 token hash, no client access at all) — split because Realtime broadcasts a table's rows, so the secret can't be a mere hidden column. All writes go through **token-checked `SECURITY DEFINER` RPCs** (`create_live_game`, `update_live_game`, `end_live_game`). Routes (next session): `/board/[code]` display, `/board/[code]/control` phone. Tracking: per-prize –/+ steppers (reversible) + a "common pulled" tap; vendor toggles which display panels show.
**Why:** Robust + low-maintenance + free-tier-ample (2 connections/board vs 500 limit); the two-table split is what truly keeps the control secret off the public board. Architecture pressure-tested with Gemini (gemini-2.5-pro via `pal`); secure pairing flipped from Gemini's first cut (control QR on the iPad) to phone-controls / iPad-view-only per the owner. **Realized this session:** the migration `supabase/migrations/20260607120000_live_game_board.sql` is **applied to remote and verified** (public read exposes no secret; secrets table denied 401; direct table writes RLS-blocked; updates require the correct token). **App code is next session.** See `docs/modules/live-board.md`.

## Decision 039 — Live Game Board app built; adopt `qrcode.react` for the watch QR
**Date:** 2026-06-07
**Question:** Implementing Decision 038's app layer, one dependency question came up: the iPad display needs a "scan to watch" QR code. How do we generate it on the free stack without weakening the security model or adding a third-party runtime call?
**Options:** (a) Add a small client-side QR library (`qrcode.react`, MIT) | (b) Hit an external QR image service (e.g. `api.qrserver.com`) as an `<img src>` | (c) Hand-roll a QR encoder in `lib/`
**Choice:** **(a) `qrcode.react@^4.2.0`** — renders the QR as inline SVG, entirely client-side, MIT-licensed, works offline. The QR only ever encodes the **public** display URL (`…/board/<code>`), never the control token, so it stays view-only by construction.
**Why:** (b) leaks the (admittedly non-secret) URL to a third party on every render and breaks if that service is down or the venue WiFi is flaky; (c) is ~500 lines of error-prone Reed-Solomon/masking code for no benefit. A tiny, well-known SVG QR component is the right call and is squarely **in scope** for the already-approved Decision 038 feature (so no new scope). **Realized this session (Session 9):** the full Live Game Board app — pure logic in `lib/live-board/{types,state,odds,code,client}.ts`; UI in `components/live-board/{StartLiveBoard,BoardController,BoardDisplay,JoinBoardForm,WatchQR,AnimatedNumber}.tsx`; routes `app/board/page.tsx`, `app/board/[code]/page.tsx`, `app/board/[code]/control/page.tsx`; wired into `components/calculator/Calculator.tsx`; 18 tests in `tests/live-board.test.ts`. The Session-8 migration was **not** touched. Verified end-to-end against the remote project: token-checked RPC writes (wrong token rejected), public read leaks no secret, and Supabase Realtime delivers `postgres_changes` (INSERT/UPDATE/DELETE) — including with the `id=eq.<id>` filter. Gotcha logged: a sub-second window between `.subscribe()`→SUBSCRIBED and the binding going live can drop one update, which is harmless because the whole-state design re-syncs on the next event. Sprint 7 is now **complete.**
