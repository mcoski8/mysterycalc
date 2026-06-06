// ============================================================
// Game Types — the per-format facts, in one small table.
//
// Plain English: oripa, walls of sleeves, prize wheels, kuji, razz…
// they all run on the SAME margin math (see lib/engine). The only
// things that really differ between them are (a) the words on screen
// ("sleeve" vs "spin" vs "spot"), and (b) two yes/no structural
// facts: does every chance win a prize, and is there just one winner.
//
// Keeping those differences here — and ONLY here — is the design
// goal: adding a new finite-pool game later is one row in this table,
// not a new pile of math.
// ============================================================

import type { GameType, GameTypeMeta } from "@/lib/types";

/**
 * The single source of truth for each v1 game type. The engine reads
 * `everyChanceWins` / `singleWinner` from here to decide how to model
 * the per-chance prize distribution (e.g. razz adds implicit "no-win"
 * chances). The UI reads the words and the default margin.
 */
export const GAME_TYPES: Record<GameType, GameTypeMeta> = {
  oripa: {
    id: "oripa",
    displayName: "Oripa",
    chanceWord: "pack",
    chanceWordPlural: "packs",
    everyChanceWins: true,
    allowsFiller: true,
    singleWinner: false,
    defaultMargin: 0.3,
  },
  mysteryBox: {
    id: "mysteryBox",
    displayName: "Mystery box / pack / bag",
    chanceWord: "box",
    chanceWordPlural: "boxes",
    everyChanceWins: true,
    allowsFiller: true,
    singleWinner: false,
    defaultMargin: 0.3,
  },
  wallOfSleeves: {
    id: "wallOfSleeves",
    displayName: "Wall of sleeves / prize wall",
    chanceWord: "sleeve",
    chanceWordPlural: "sleeves",
    everyChanceWins: true,
    allowsFiller: true,
    singleWinner: false,
    defaultMargin: 0.35,
  },
  slabLot: {
    id: "slabLot",
    displayName: "Mystery slab lot",
    chanceWord: "slab",
    chanceWordPlural: "slabs",
    everyChanceWins: true,
    allowsFiller: true,
    singleWinner: false,
    defaultMargin: 0.3,
  },
  prizeWheel: {
    id: "prizeWheel",
    displayName: "Prize wheel / Plinko",
    chanceWord: "spin",
    chanceWordPlural: "spins",
    everyChanceWins: true,
    // The low tiers ARE the filler on a wheel, so filler still applies.
    allowsFiller: true,
    singleWinner: false,
    defaultMargin: 0.4,
  },
  kuji: {
    id: "kuji",
    displayName: "Kuji",
    chanceWord: "ticket",
    chanceWordPlural: "tickets",
    everyChanceWins: true,
    allowsFiller: true,
    singleWinner: false,
    defaultMargin: 0.35,
  },
  razz: {
    id: "razz",
    displayName: "Razz / raffle",
    chanceWord: "spot",
    chanceWordPlural: "spots",
    // The one exception: a single prize, N spots, exactly one winner.
    everyChanceWins: false,
    allowsFiller: false,
    singleWinner: true,
    defaultMargin: 0.2,
  },
};

/** Convenience: look up one game type's facts. */
export function gameMeta(type: GameType): GameTypeMeta {
  return GAME_TYPES[type];
}

/** The list, in display order, for populating a picker in the UI. */
export const GAME_TYPE_LIST: GameTypeMeta[] = [
  GAME_TYPES.oripa,
  GAME_TYPES.mysteryBox,
  GAME_TYPES.wallOfSleeves,
  GAME_TYPES.slabLot,
  GAME_TYPES.prizeWheel,
  GAME_TYPES.kuji,
  GAME_TYPES.razz,
];
