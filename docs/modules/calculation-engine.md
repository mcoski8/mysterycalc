# Module — Calculation Engine

> **Location (planned):** `lib/engine/` (pure TypeScript — no React, no database).
> **Status:** Spec only (Phase 1 / Sprint 1 will build it).
> **Read this before touching any math.** This is the product. Everything else is a wrapper around it.

---

## What this module does (plain English)

It's the brain that turns a **prize pool** and a **game setup** into the numbers a vendor needs: the price,
the number of chances, the margin, the real profit, and what the game feels like to play. It's "just math" —
you give it inputs, it gives you results. No screens, no saving, no internet. That purity is deliberate: it
makes the engine easy to test and impossible to break by accident from the UI.

## The vocabulary (used everywhere)

- **V** — total **prize-pool value** (market). The sum of every item's market value × its quantity.
- **C** — total **prize-pool cost**. The sum of every item's cost × its quantity. (What the vendor paid.)
- **N** — **number of chances** (sleeves / tickets / spins / packs sold).
- **P** — **buy-in price** per chance.
- **R** — **revenue** at full sellout = N × P.

## The core relationships (label the math in words — see comment standard)

- **Revenue:** `R = N × P` — money in if every chance sells.
- **Margin (the % the house keeps, vs. market value):** `m = 1 − V / (N × P)`.
  - In words: the prizes are worth V; players pay N×P; the slice you keep is whatever's left over, as a fraction.
- **True profit (what actually lands in the vendor's pocket):** `profit = R − C = N×P − C`.
  - GOTCHA: profit uses **cost (C)**, not market value (V). A pool can "look" worth $1,180 while costing $400.
- **Player's average value per chance:** `V / N`.

## Solve-for-anything (the headline feature)

Given any **two** of {P, N, m}, compute the third. Derived from `m = 1 − V/(N×P)`:

| You know | You want | Formula | In words |
|----------|----------|---------|----------|
| V, N, m | P | `P = V / (N × (1 − m))` | price each chance must cost to hit the margin |
| V, P, m | N | `N = V / (P × (1 − m))` | how many chances to sell to hit the margin |
| V, N, P | m | `m = 1 − V / (N × P)` | the margin you'd get at this price and count |

WARNING: `(1 − m)` must be > 0, i.e. margin `m` < 1. A margin of 1 means "prizes are worth $0," which makes
the price/chances formulas divide by zero. Guard before computing.

## The critical structural rule — "every chance wins" (Σ quantities = N)

For the **every-chance-wins** game types (oripa, wall of sleeves, prize wheel, kuji, slab lots), **every
chance yields exactly one prize**, so the total number of prize units must equal the number of chances:

```
Σ (quantity of each prize item) = N
```

This forces the vendor to account for the "boring" chances too — the **filler** (e.g. "the other 95 sleeves
each hold a $4 common pack"). The engine works with the `prize-pool` module to **auto-balance** filler so this
identity always holds as items are edited (see `docs/modules/prize-pool.md`).

**Razz / raffle is the one exception:** there is **1 prize** but **N chances**, and only one winner. The
margin formula `m = 1 − V/(N×P)` still applies unchanged (V here is the single prize's value).

## Outputs beyond the average (game "feel" — Decision 010)

The mean (margin) doesn't tell you if a game is exciting or boring. The engine also returns:

- **Hit rate** — the % of chances whose prize market value is **≥ the buy-in P**. (The headline marketing
  number: "X% of players win more than they pay.")
- **Prize-tier breakdown** — counts of prizes in value buckets relative to P, e.g.:
  - *Chase:* value > 5 × P
  - *Win:* P ≤ value ≤ 5 × P
  - *Dud:* value < P
  (Bucket thresholds are configurable defaults, not hard law.)
- **Volatility** — a simple **Low / Medium / High** read derived from the standard deviation of prize value
  across all N chances. High = one big chase + many duds (lottery feel); Low = everything similar (flat feel).

## Sell-through / break-even (Decision 011 — pending owner confirm)

Revenue assumes a full sellout. The engine can also report the **break-even count**: the number of chances
that must sell for revenue to cover the prize **cost**:

```
breakEvenChances = ceil(C / P)
```

In words: "you stop losing money once this many chances sell." (Pending whether this ships in v1.)

## Per-prize odds (feeds the odds sheet — Phase 3)

For each prize item: `probability = quantity / N`. This is the data the customer-facing odds sheet renders
(`docs/modules/odds-sheet.md`). The engine computes it; the sheet just formats it.

## Suggested public shape (illustrative — finalize in Sprint 1)

```ts
// Inputs
type PrizeItem = {
  name: string
  type: 'pack' | 'sealed' | 'single' | 'slab' | 'voucher' | 'filler'
  marketValue: number   // per unit
  cost: number          // per unit, what the vendor paid
  quantity: number
  isFiller?: boolean
}

type GameConfig = {
  gameType: GameType            // see docs/modules/game-types.md
  // Provide exactly TWO of these three; the engine solves the third:
  buyIn?: number                // P
  chances?: number              // N
  targetMargin?: number         // m, 0–1
}

// Output
type GameResult = {
  poolValue: number             // V
  poolCost: number              // C
  chances: number               // N (given or solved)
  buyIn: number                 // P (given or solved)
  revenue: number               // R = N×P
  marginPct: number             // m
  profit: number                // R − C
  poolMultiple: number          // R / V
  hitRate: number               // % chances with value ≥ P
  tiers: { chase: number; win: number; dud: number }
  volatility: 'low' | 'medium' | 'high'
  breakEvenChances: number
  perPrizeOdds: { name: string; probability: number }[]
  warnings: string[]            // e.g. "margin ≥ 1", "filler auto-added to reach N"
}
```

## Rules for this module

- **Pure functions only.** No fetch, no DB, no React, no `Date.now()`-style nondeterminism. Same inputs →
  same outputs, always. This is what makes it testable.
- **Fail loudly.** Invalid inputs (margin ≥ 1, N ≤ 0, empty pool, two-of-three not provided) return clear
  errors / warnings — never a silent wrong number.
- **Comment the math in words** per the `docs/CLAUDE.md` standard — a semi-non-technical reader must be able
  to follow each formula.
- **Test first.** Sprint 1 builds the test suite alongside the engine: every formula, the worked example, the
  Σ=N rule, the razz special case, and every edge case.

## The worked example (must reproduce exactly — acceptance test)

Pool: 1 slab @ $600 + 4 ETBs @ $50 + 95 filler packs @ $4 → **V = $1,180**, N = 100.
- At **P = $20**: R = $2,000, **margin = 1 − 1180/2000 = 41%**, player avg = $11.80/chance.
- Target **35%** at P = $20 → **N = 1180 / (20 × 0.65) ≈ 90.8 → 91 chances**.
