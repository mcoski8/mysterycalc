# Module — Prize Pool (inventory input)

> **Location (planned):** `lib/pool/` (data model + helpers) + `app/` UI for entry.
> **Status:** Spec only (Phase 1 / Sprint 1).
> **Related:** `docs/modules/calculation-engine.md` (consumes the pool), `docs/modules/game-types.md`.

---

## What this module does (plain English)

It's where the vendor lists the prizes they're putting up. Each line is one kind of prize — its name, what
it's worth (market), what it cost the vendor, and how many of them. The module also handles **filler** (the
cheap "everyone-else" prizes) and keeps the pool consistent with the number of chances.

## The prize item

Each item carries:
- **name** — e.g. "PSA 10 Charizard", "Prismatic ETB", "common pack".
- **type** — `pack | sealed | single | slab | voucher | filler`. (Used for grouping/reporting and odds-sheet
  labels; doesn't change the math.)
- **marketValue** — per-unit market value. Drives the advertised pool size **V** and the player's odds/EV.
- **cost** — per-unit cost to the vendor. Drives **true profit**. (Default it to 0 if unknown, but warn.)
- **quantity** — how many of this item are in the pool.
- **isFiller** — whether this line is auto-managed filler (see below).

A **voucher** is a prize that says "you won a booster box / ETB / pack" — common in US walls of sleeves. For
the math it's just an item with a market value (the value of what the voucher redeems for).

## Totals the module computes

- **Pool value V** = Σ (marketValue × quantity)
- **Pool cost C** = Σ (cost × quantity)
- **Prize count** = Σ quantity

## Filler + auto-balance (Decision 009 — the central usability feature)

In every-chance-wins games, **prize count must equal N** (`docs/modules/calculation-engine.md`). Vendors
naturally list only the exciting prizes ("1 slab, 4 ETBs") and forget that the other 95 chances also contain
*something*. The module handles this:

- The vendor defines a **filler line** ("common pack", $4 market, $1 cost) and the tool computes how many
  filler units are needed: `fillerCount = N − Σ(non-filler quantities)`.
- As the vendor edits hits or changes N, the filler quantity **auto-adjusts** so prize count stays = N.
- GOTCHA: if non-filler quantities already exceed N, that's an error (you can't fit more prizes than chances)
  — surface it clearly, don't silently truncate.
- WARNING: filler still counts toward **V and C**. Cheap filler is still worth something and still cost
  something; ignoring it would overstate margin.

For **razz** (one prize, N chances) filler does **not** apply — there's a single prize and the other chances
win nothing. The module knows this from the game type (`docs/modules/game-types.md`).

## Input UX notes (Phase 1)

- Add / edit / remove item lines; a clear running total of V, C, and prize count vs. N.
- A one-click **"add filler to fill N"** action.
- Bulk entry for big pools (the owner may run hundreds–~1,000 sleeves — confirm size; it affects perf and the
  input pattern). Until confirmed, design for "hundreds" gracefully.
- Show market value and cost side by side so the vendor always sees both stories.

## Rules

- Keep the pool data model framework-free in `lib/` so the engine and (later) the odds sheet reuse it.
- Validate: non-negative values/quantities; warn on cost = 0; error on prize-count > N.
- Comment for technical + semi-non-technical readers per `docs/CLAUDE.md`.
