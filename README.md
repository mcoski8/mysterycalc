# MysteryCalc

A free web app that helps vendors **design and price mystery games** (oripa, mystery boxes, walls of sleeves, prize wheels, kuji, razzes). Enter the prizes you're putting up; MysteryCalc tells you the buy-in price, the number of chances, your real profit, and how the game *feels* to play — plus a printable customer odds sheet.

> **Status:** Planning (Phase 0). Documentation and architecture only — no application code yet. See `docs/PROPOSAL.md` (the sign-off gate) and `docs/CURRENT_PHASE.md`.

## What it does (planned)

- Add prize inventory with **market value** and **your cost** (including bulk "filler").
- Pick a game type, then set any two of **{buy-in price, number of chances, target margin}** — it solves the third.
- See your cut three ways (**% kept, dollars of profit, pool multiple**), plus the **hit rate**, the **prize-tier breakdown**, and the **break-even point**.
- Generate a **printable / shareable customer odds sheet**.
- Save and reuse game setups.

## For developers / AI assistants

Start with `docs/CLAUDE.md`, then `docs/CURRENT_PHASE.md`, then the active sprint file in `docs/sprints/`. The documentation system (append-only decisions, per-session handoffs, sprint logs, end-of-session ritual) is described in `PROCESS.md` and mirrors the owner's PokeSentry / PokeHolder projects.

## Tech stack (planned)

Next.js (App Router) + TypeScript · Tailwind + shadcn/ui · Supabase (auth + storage) · Vercel. The calculation engine is pure, framework-free TypeScript in `lib/`.
