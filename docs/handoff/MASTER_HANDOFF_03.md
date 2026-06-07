# MASTER_HANDOFF_03 — Sessions 8+

> Append-only session journal. Continues from `MASTER_HANDOFF_02.md` (Sessions 5–7: Phase 4 price lookup,
> Sprint 4.5 sealed pricing, Phase 5 launch — the product shipped). When this file passes ~15KB, close it
> with a summary header and start `MASTER_HANDOFF_04.md` (and point `CURRENT_PHASE.md` at it).

---

## Session 8 — 2026-06-07 — Post-launch UX overhaul + Live Game Board kickoff

### What we accomplished
**A. Post-launch UX overhaul (Sprint 6 — shipped to production, several commits).**
- **Design system** (Decision 035): replaced the default grayscale shadcn theme with a cohesive **violet +
  gold** OKLCH palette (light + dark); fixed a latent bug where `--font-sans` was self-referential (Geist
  never applied); added **Space Grotesk** display font, an aurora background glow, gradient
  wordmark/logo-mark/numbered-step-badges/lead-result-tile. Files: `app/globals.css`, `app/layout.tsx`,
  `app/page.tsx`, `app/login/page.tsx`, `components/calculator/*`.
- **`/guide` page**: a field guide to every JP/US mystery format + a game-type info panel under the picker
  (`app/guide/page.tsx`, `lib/games/game-info.ts`).
- **Profit goal in 3 units** (Decision 036): "Target margin" → "Profit goal" with a %/$/× toggle; pure
  converter `lib/games/goal.ts`; engine + DB unchanged; `tests/goal.test.ts`.
- **Search overhaul** (Decision 037): raised caps (singles 40, sealed 30), relevance ranking across
  singles+sealed, and **set-name matching** (so "charizard paldean" finds the Paldean-Fates Charizard).
  `lib/prices/relevance.ts`, the sources, `composite.ts`, `CardSearch.tsx`, `tests/relevance.test.ts`.
- **Dark mode** (Decision 035): `next-themes` (system default, no FOUC), toggle in header + footer.
  `components/theme/ThemeProvider.tsx`, `components/theme/ThemeToggle.tsx`.
- **Mobile pass**: prize editor + odds table become stacked cards below `sm`; fixed a real ≤390px header
  overflow (CDP-measured); "via TCGPlayer" attribution; prize-pool empty state.

**B. Live Game Board — Sprint 7 kickoff (Decision 038). Data layer DONE; app code next session.**
- Designed the feature with Gemini (gemini-2.5-pro via `pal`): customer-facing iPad scoreboard, vendor
  controls from phone, real-time via Supabase `postgres_changes`. **Owner flipped the pairing to
  phone-controls / iPad-view-only** (secure: control token never on a public screen).
- **Migration `supabase/migrations/20260607120000_live_game_board.sql` applied to remote + verified.**
  Two tables (`live_games` public+realtime, `live_game_secrets` locked) + token-checked `SECURITY DEFINER`
  RPCs `create_live_game` / `update_live_game` / `end_live_game`. RLS verified with the anon key (create ok;
  public read exposes no secret; secrets table 401; direct write RLS-blocked; update needs the token; end
  cascades). Module doc: `docs/modules/live-board.md`.

### What was decided
Decisions **035** (UX overhaul + dark mode / `next-themes`), **036** (profit-goal units), **037** (search
ranking + set-name), **038** (Live Game Board feature + architecture). See `DECISIONS_LOG.md`.

### What's open / next (Sprint 7 — build the Live Game Board app)
1. **Step 2 — Controller (phone):** "Start Live Board" → `create_live_game` (store token in `localStorage`);
   `app/board/[code]/control/page.tsx` with –/+ steppers + "common pulled" + panel toggles + offline banner.
2. **Step 3 — Display (iPad):** `app/board/[code]/page.tsx` subscribing to `postgres_changes`, re-fetch on
   reconnect, recompute odds from `lib/engine`; the four big-screen panels + "scan to watch" QR; a code-entry
   landing so the iPad joins by typing the code.
3. **Step 4 — Resilience + tests:** reconnect/replay, keep state transitions pure in `lib/` + tested.

### Landmines / gotchas for next session
- **Never expose the control token** — it lives only in the controller phone's `localStorage`; the DB keeps
  only its SHA-256 hash in the locked `live_game_secrets` table (not published to Realtime).
- **Realtime** needs the table in the `supabase_realtime` publication (done) AND a SELECT policy the
  subscriber passes (public read in place). Recompute odds from `initial_pool` + `current_state` — never
  trust stored odds.
- **Mobile screenshots:** the Chrome `--screenshot` flag renders at the wrong width — use CDP
  `Emulation.setDeviceMetricsOverride` to measure (`scrollWidth === clientWidth` = no overflow).
- **`next-themes` `mounted` flag** trips React 19 `react-hooks/set-state-in-effect`; one-line eslint-disable
  is the accepted pattern.
- **Push = prod deploy** (git-connected). Keep `main` releasable. Live Board UI isn't built yet, so the new
  table is dormant in production — safe.
- Supabase CLI is linked; `supabase db push` applies migrations (init, sealed, live_game_board all applied;
  `supabase migration list` shows all three synced).
