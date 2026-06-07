// ============================================================
// Live Game Board — shared shapes for the real-time scoreboard.
//
// Plain English: the Live Game Board is a customer-facing iPad display of
// a running mystery game — "X of N left", which big chases are still up
// for grabs, the live odds, and a ticker of recent wins. The vendor's
// phone controls it; the iPad just watches. These types are the shared
// dictionary all three pieces (the database row, the phone controller,
// and the iPad display) speak.
//
// The board reuses the calculator's core idea of a PrizeItem[] "pool"
// (lib/types). What changes mid-game is captured in `LiveCurrentState`;
// everything else (`initial_pool`, `initial_chances`) is frozen at start.
//
// Nothing here does anything — it only describes shapes. The pure
// state-transition logic lives in lib/live-board/state.ts; the live-odds
// math in lib/live-board/odds.ts; the Supabase calls in client.ts.
// ============================================================

import type { GameType, PrizeItem } from "@/lib/types";

/**
 * One entry in the "recent wins" ticker. `ts` is a Unix epoch in
 * milliseconds (supplied by the caller, so the state helpers stay pure).
 * We deliberately store only a display name + time — never anything that
 * could identify the player or leak the control token.
 */
export type RecentWin = {
  name: string;
  ts: number;
};

/**
 * The ONLY part of a board that changes once the game is running. We store
 * the WHOLE current state (not a stream of events) so a reloaded iPad or a
 * WiFi blip self-heals by simply re-reading this one blob.
 *
 *  - remaining:        how many of each prize line are still unclaimed,
 *                      keyed by the prize's stable id.
 *  - chancesRemaining: how many chances (sleeves / spins / tickets…) are
 *                      still left to sell — the headline "X of N left".
 *  - recentWins:       the latest notable pulls, newest first.
 */
export type LiveCurrentState = {
  remaining: Record<string, number>;
  chancesRemaining: number;
  recentWins: RecentWin[];
};

/** The four big-screen panels the iPad can show. */
export type LivePanelKey = "countLeft" | "chaseLeft" | "liveOdds" | "recentWins";

/**
 * Which panels the vendor has chosen to show, plus an optional board title
 * ("Wall of Sleeves — Saturday"). Toggling a panel on the phone updates the
 * iPad live, because this travels in the same row as the game state.
 */
export type DisplayConfig = {
  panels: Record<LivePanelKey, boolean>;
  /** Optional friendly heading shown across the top of the display. */
  title?: string;
};

/**
 * A board exactly as it comes back from the `live_games` table. The jsonb
 * columns (`initial_pool`, `current_state`, `display_config`) arrive already
 * parsed into objects by supabase-js. This row carries NO secret — the
 * control token's hash lives in the separate, locked `live_game_secrets`
 * table that is never published or readable.
 */
export type LiveGameRow = {
  id: string;
  short_code: string;
  game_type: GameType;
  buy_in: number;
  initial_chances: number;
  initial_pool: PrizeItem[];
  current_state: LiveCurrentState;
  display_config: DisplayConfig;
  created_at: string;
  updated_at: string;
};
