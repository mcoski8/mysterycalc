// ============================================================
// Engine barrel — the public front door to the math layer.
//
// Plain English: instead of importing from a dozen deep file paths,
// the rest of the app imports everything it needs from one place:
//   import { solveGame, GAME_TYPE_LIST } from "@/lib/engine"
// This keeps the engine's internal file layout free to change without
// breaking every caller.
// ============================================================

export * from "@/lib/types";
export * from "@/lib/errors";
export * from "@/lib/engine/engine";
export {
  GAME_TYPES,
  GAME_TYPE_LIST,
  gameMeta,
} from "@/lib/games/game-types";
export {
  poolValue,
  poolCost,
  prizeCount,
  nonFillerCount,
  fillerNeeded,
  balanceFiller,
  validatePool,
} from "@/lib/pool/pool";
