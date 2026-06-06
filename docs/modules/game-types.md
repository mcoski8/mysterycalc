# Module — Game Types (the finite-pool family)

> **Location:** `lib/games/game-types.ts` (per-type config + defaults; `GAME_TYPES`, `GAME_TYPE_LIST`, `gameMeta`).
> **Status:** ✅ **Implemented** (Sprint 1, 2026-06-05). All 7 types ship with `chanceWord`/`chanceWordPlural`,
> `everyChanceWins`/`allowsFiller`/`singleWinner` flags, and a `defaultMargin`.
> **Related:** `docs/modules/calculation-engine.md`, `docs/modules/prize-pool.md`,
> `docs/research/japanese-vs-american-mystery-games.md` (full background on each game).

---

## What this module does (plain English)

All the v1 games run on the **same math** (the calculation engine). What differs between them is small:
whether every chance wins, whether filler applies, the vocabulary on screen ("sleeves" vs "tickets" vs
"spins"), and sensible default settings. This module holds those per-type differences so the rest of the app
stays generic.

## The shared model

Every v1 game type is a **finite pool of N chances priced at P, giving out a pool worth V** — so the engine's
`m = 1 − V/(N×P)` and solve-for-anything apply to all of them. The only real structural split is:

- **Every-chance-wins** (Σ quantities = N, filler applies), vs.
- **Single-winner** (razz: 1 prize, N chances, no filler).

## The v1 game types

| Game type | Every chance wins? | Filler? | On-screen word for a "chance" | Notes |
|-----------|--------------------|---------|-------------------------------|-------|
| **Oripa** | Yes | Yes | "pack" / "pull" | Japanese custom mystery pack; the canonical case. |
| **Mystery box / pack / bag** | Yes | Yes | "box" / "pack" | US analog to physical oripa. |
| **Wall of sleeves / prize wall** | Yes | Yes | "sleeve" | Vouchers common (item type `voucher`). |
| **Mystery slab lot** | Yes | Yes | "slab" | Each chance is a graded card; often a guaranteed grade. |
| **Prize wheel / Plinko** | Yes | Yes (as low tiers) | "spin" | Tiered; filler = the low/"dud" tiers. |
| **Kuji** | Yes | Yes (as low tiers) | "ticket" | Tiered A/B/C…; optional "Last One" prize (see below). |
| **Razz / raffle** | **No** | **No** | "spot" | Single winner; 1 prize, N spots. Legal-sensitive (Decision 011/Q3). |

## Per-type defaults & helpers (illustrative)

Each type provides:
- a **label set** (what to call a "chance," a "prize," the action), so the UI reads naturally;
- **sensible defaults** (e.g. a starting margin suggestion, whether to prompt for filler immediately);
- any **structural flag** the engine/pool need (`everyChanceWins`, `allowsFiller`, `singleWinner`).

```ts
type GameType =
  | 'oripa' | 'mysteryBox' | 'wallOfSleeves'
  | 'slabLot' | 'prizeWheel' | 'kuji' | 'razz'

type GameTypeMeta = {
  id: GameType
  displayName: string
  chanceWord: string          // "sleeve", "ticket", "spin", "spot"
  everyChanceWins: boolean
  allowsFiller: boolean
  singleWinner: boolean
}
```

## Tiered games (kuji, prize wheel) — modeling note

Tiers are **not** a new math model — a tier is just a group of prize items with the same value and a quantity.
"Tier A ×1 @ $500, Tier B ×3 @ $100, Tier C ×6 @ $20, … filler ×90 @ $2" is simply a prize pool where
Σ quantities = N. The UI may *present* it as tiers for convenience, but underneath it's the same pool the
engine already handles. Per-tier odds = tier quantity ÷ N (feeds the odds sheet).

GOTCHA — kuji's **"Last One" prize:** in real kuji, one special prize goes to whoever draws the *final*
ticket. For v1 we treat it as an ordinary pool item (quantity 1) and note the "awarded to the last draw"
behavior on the odds sheet; we do **not** model draw-order mechanics. Flag for a future enhancement if needed.

## Out of scope (do not add without a new decision)

- **Live Box Breaks** — different math (cost of sealed product + expected pull-value distribution). Deferred.
- **Claw / UFO catcher** — no fixed pool of chances. Out permanently.

## Rules

- Keep this module thin: it configures the generic engine; it must not re-implement any math.
- Adding a new finite-pool game = one entry here + (maybe) a label set. That's the design goal.
- Comment for technical + semi-non-technical readers per `docs/CLAUDE.md`.
