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

---

## Session 9 — 2026-06-07 — Live Game Board app (Sprint 7 complete)

**Accomplished — built the entire app on top of Session 8's verified data layer (migration untouched):**
- **Pure, tested logic** in `lib/live-board/`: `types.ts`, `state.ts` (markWon/undoWon/togglePanel/initialState —
  floors at 0, caps at start qty, filler kept out of the wins ticker, ticker capped at 50), `odds.ts`
  (countLeft/liveOdds/chasePrizesLeft/prizesRemaining, all recomputed from remaining — stored odds never trusted),
  `code.ts` (normalizeCode/isCompleteCode), `client.ts` (RPC wrappers + localStorage token helpers).
- **UI** in `components/live-board/`: `StartLiveBoard` (calculator → create board), `BoardController` (phone:
  steppers, common-pulled, panel toggles, offline banner, end), `BoardDisplay` (iPad: realtime, 4 panels,
  animated counts, QR), `JoinBoardForm` (code entry), `WatchQR` (qrcode.react SVG), `AnimatedNumber`.
- **Routes**: `app/board/page.tsx`, `app/board/[code]/page.tsx`, `app/board/[code]/control/page.tsx`. Wired
  `StartLiveBoard` into `components/calculator/Calculator.tsx` (renders only when a game is solved).
- **Tests**: `tests/live-board.test.ts` (18). Suite 70 → 88, all green.

**Decided:** Decision 039 — adopt `qrcode.react@^4.2.0` (MIT, inline SVG, offline) for the watch QR; it only ever
encodes the public display URL, never the token. In scope for Decision 038, so no new scope.

**Verified myself (not asked of the owner):** typecheck / lint / 88 tests / build all green. Live RPC round-trip
on the remote project (anon key): create returns code+token; public read leaks no token/hash; update needs the
right token (wrong → "invalid control token"); end deletes. Realtime `postgres_changes` (INSERT/UPDATE/DELETE)
delivered, including with the `id=eq.<id>` filter. 0 test rows left behind.

**Open / next:** Sprint 7 is done. Nothing required to ship — the routes are live on next push (prod auto-deploy).
Possible future polish (not committed): board auto-expiry/cleanup cron; a "my live boards" list; richer razz
semantics; optional realtime catch-up read on first subscribe (currently relies on whole-state self-heal).

**Landmines for next session:**
- The sub-second `.subscribe()`→SUBSCRIBED binding window can drop one update; harmless due to whole-state writes
  (next event re-syncs). Don't "fix" it by switching to event/delta writes — that would reintroduce replay bugs.
- React 19 `react-hooks/set-state-in-effect` trips on client-only inits (window.origin, navigator.onLine) —
  one-line eslint-disable, same as the `next-themes` mounted flag.
- `display_config` (panels + title) rides in the same row as state, so phone toggles reach the iPad live.
- Pre-existing `npm audit` items (postcss, vitest, breaking-change fixes) are unrelated — left alone.

---

## Session 10 — 2026-06-08 — Owner live walk-through (board verified on real devices)

**What we accomplished:** closed Sprint 7's one open item — a real, owner-driven walk-through of the Live Game
Board. Setup: the owner's **phone as the controller** + the **Mac mini's monitor as the customer display**
(browser window standing in for the iPad — same role). The owner built a game on the phone, hit "Start live
board," entered the pairing code on the monitor, and marked wins. **The full real-time loop (phone → Supabase →
big screen) updated within ~a second with no refresh, and works really well (owner's words).** No UX rough edges
surfaced on either screen. The board is now **owner-verified live**, not just plumbing-verified. No code written.

**De-risk before the walk-through:** a fresh anon-key RPC round-trip against the *prod* Supabase confirmed the
live path first — `create_live_game` → code + 36-char token; public read leaks no token/hash; secrets table →
**401 denied**; update with a wrong token → **400 "invalid control token"**, right token → 204 + state persisted;
`end_live_game` → 204; throwaway board cleaned up. `/board` serves 200 in prod.

**Decided:** nothing new (DECISIONS_LOG unchanged through 039). This was verification only.

**Open / next:** Sprint 7 fully done + verified. Optional future polish remains un-started: board
auto-expiry/cleanup cron · a "my live boards" list on the controller · richer razz (single-winner) semantics ·
an explicit first-subscribe catch-up read. No forced next task.

**Landmine learned:** `live_games_game_type_chk` only accepts exact engine `GameType` strings
(`oripa`/`mysteryBox`/`wallOfSleeves`/`slabLot`/`prizeWheel`/`kuji`/`razz`) — a casual `"wall"` is rejected.
Only matters for manual RPC pokes; the app always sends the right value.
