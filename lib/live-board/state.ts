// ============================================================
// Live Game Board — the state-transition rules (pure & tested).
//
// Plain English: this file knows how a board's live state changes when the
// vendor taps a win on their phone, and how to undo a mis-tap. It does NOT
// touch the screen, the network, or the clock — every function takes its
// inputs and returns a brand-new state object, leaving the old one alone.
// That purity is what lets us unit-test the tricky bits (don't go below
// zero, don't undo past the starting count, keep the ticker tidy) without
// spinning up React or Supabase.
//
// The controller component (components/live-board/BoardController) calls
// these, then ships the returned whole-state blob to the database via
// lib/live-board/client. The display recomputes odds from it separately
// (lib/live-board/odds).
// ============================================================

import type { PrizeItem } from "@/lib/types";
import type { DisplayConfig, LiveCurrentState, LivePanelKey } from "@/lib/live-board/types";

/** How many recent wins we keep in the row (the ticker shows a slice). */
export const MAX_RECENT_WINS = 50;

/** Which panels a brand-new board shows by default — all of them. */
export const DEFAULT_PANELS: Record<LivePanelKey, boolean> = {
  countLeft: true,
  chaseLeft: true,
  liveOdds: true,
  recentWins: true,
};

/**
 * The starting display config for a new board: every panel on, plus an
 * optional title the vendor can type when launching.
 */
export function defaultDisplayConfig(title?: string): DisplayConfig {
  const config: DisplayConfig = { panels: { ...DEFAULT_PANELS } };
  if (title && title.trim()) config.title = title.trim();
  return config;
}

/**
 * Build the opening state of a board from the frozen pool + chance count.
 * In words: every prize starts at its full quantity, the whole run of
 * chances is still to sell, and the wins ticker is empty.
 */
export function initialState(items: PrizeItem[], chances: number): LiveCurrentState {
  const remaining: Record<string, number> = {};
  for (const item of items) remaining[item.id] = item.quantity;
  return {
    remaining,
    chancesRemaining: Math.max(0, Math.round(chances)),
    recentWins: [],
  };
}

/**
 * Mark one of `item` as WON (a customer pulled it).
 *
 * In words: knock one off that prize's remaining count AND off the overall
 * chances-left (each pull uses up exactly one chance), and — unless it's
 * filler — add it to the front of the recent-wins ticker. `ts` is passed in
 * (not read from the clock) so this function stays pure and testable.
 *
 * GOTCHA: if that prize is already at zero it can't be pulled again, so we
 * return the state unchanged rather than going negative.
 */
export function markWon(
  state: LiveCurrentState,
  item: PrizeItem,
  ts: number,
): LiveCurrentState {
  const current = state.remaining[item.id] ?? 0;
  if (current <= 0) return state; // nothing left of this prize — ignore the tap

  const remaining = { ...state.remaining, [item.id]: current - 1 };
  const chancesRemaining = Math.max(0, state.chancesRemaining - 1);

  // Filler ("common pack pulled") still consumes a chance, but it's noise in
  // a "recent WINS" ticker, so we don't announce it.
  const recentWins = item.isFiller
    ? state.recentWins
    : [{ name: item.name, ts }, ...state.recentWins].slice(0, MAX_RECENT_WINS);

  return { remaining, chancesRemaining, recentWins };
}

/**
 * Undo a win for `item` (the vendor mis-tapped).
 *
 * In words: put one back on that prize's remaining count and back onto the
 * chances-left, then drop the most recent ticker entry with that name. We
 * cap at the prize's original quantity and at `initialChances` so undo can
 * never invent prizes or chances that never existed.
 */
export function undoWon(
  state: LiveCurrentState,
  item: PrizeItem,
  initialChances: number,
): LiveCurrentState {
  const current = state.remaining[item.id] ?? 0;
  if (current >= item.quantity) return state; // already at full — nothing to undo

  const remaining = { ...state.remaining, [item.id]: current + 1 };
  const chancesRemaining = Math.min(initialChances, state.chancesRemaining + 1);

  // Remove the newest ticker entry matching this prize's name (filler was
  // never added, so there's nothing to pull off for it).
  let recentWins = state.recentWins;
  if (!item.isFiller) {
    const idx = state.recentWins.findIndex((w) => w.name === item.name);
    if (idx !== -1) {
      recentWins = [
        ...state.recentWins.slice(0, idx),
        ...state.recentWins.slice(idx + 1),
      ];
    }
  }

  return { remaining, chancesRemaining, recentWins };
}

/**
 * Flip a single display panel on or off, returning a new display config.
 * (Pure helper so the controller's optimistic update and the test agree.)
 */
export function togglePanel(config: DisplayConfig, key: LivePanelKey): DisplayConfig {
  return {
    ...config,
    panels: { ...config.panels, [key]: !config.panels[key] },
  };
}
