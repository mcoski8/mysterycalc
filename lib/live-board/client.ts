// ============================================================
// Live Game Board — talking to Supabase from the browser.
//
// Plain English: this is the thin layer between the board UI and the
// database. It does four things: start a board, read a board, push new
// state, and end a board. Every WRITE goes through a token-checked database
// function (an RPC) — there is no direct table write — so the secret
// control token is the only thing that can change a board. Reading a board
// is public (anyone can WATCH), which is the whole point of the iPad
// display.
//
// It also owns where the controller phone keeps its secret token: the
// browser's localStorage, and ONLY there. The token is never rendered on
// screen and never sent anywhere except as the argument to a write RPC.
//
// Calls into: lib/supabase/client (the browser Supabase client) and the
// SECURITY DEFINER functions in the migration
// (create_live_game / update_live_game / end_live_game).
// ============================================================

"use client";

import { createClient } from "@/lib/supabase/client";
import type { GameType, PrizeItem } from "@/lib/types";
import type {
  DisplayConfig,
  LiveCurrentState,
  LiveGameRow,
} from "@/lib/live-board/types";

// Where the phone stashes a board's control token. Keyed by short code so a
// vendor can run more than one board from the same phone.
const TOKEN_PREFIX = "mc:lgb:token:";

/** Remember the control token for a board (controller phone only). */
export function saveControlToken(code: string, token: string): void {
  try {
    localStorage.setItem(TOKEN_PREFIX + code, token);
  } catch {
    // Private-mode / storage-disabled browsers: nothing we can do but the
    // caller still has the token in memory for this session.
  }
}

/** Read back the control token for a board, or null if this phone isn't the controller. */
export function getControlToken(code: string): string | null {
  try {
    return localStorage.getItem(TOKEN_PREFIX + code);
  } catch {
    return null;
  }
}

/** Forget a board's token (after ending it, or to hand off control). */
export function clearControlToken(code: string): void {
  try {
    localStorage.removeItem(TOKEN_PREFIX + code);
  } catch {
    /* ignore */
  }
}

/** Everything needed to start a board — taken from a solved game. */
export type CreateBoardInput = {
  gameType: GameType;
  buyIn: number;
  initialChances: number;
  initialPool: PrizeItem[];
  currentState: LiveCurrentState;
  displayConfig: DisplayConfig;
};

/**
 * Start a board. Returns the short pairing code + the one-time plaintext
 * control token (the caller must store the token locally and never show it).
 * The server generates both, so the client can't pick a weak token or a
 * colliding code.
 */
export async function createLiveBoard(
  input: CreateBoardInput,
): Promise<{ shortCode: string; controlToken: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_live_game", {
    p_game_type: input.gameType,
    p_buy_in: input.buyIn,
    p_initial_chances: input.initialChances,
    p_initial_pool: input.initialPool,
    p_current_state: input.currentState,
    p_display_config: input.displayConfig,
  });
  if (error) throw new Error(error.message);

  // The function returns a TABLE(short_code, control_token), so supabase-js
  // hands back an array of one row.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.short_code || !row?.control_token) {
    throw new Error("The server didn't return a board code — please try again.");
  }
  return { shortCode: row.short_code as string, controlToken: row.control_token as string };
}

/**
 * Read a board by its short code. Public — anyone may watch. Returns null if
 * there's no such board (it never started, or it has already ended).
 */
export async function fetchLiveBoard(code: string): Promise<LiveGameRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("live_games")
    .select(
      "id, short_code, game_type, buy_in, initial_chances, initial_pool, current_state, display_config, created_at, updated_at",
    )
    .eq("short_code", code)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as LiveGameRow | null) ?? null;
}

/**
 * Push the whole current state (and optionally the display config) to a
 * board. Requires the control token; a wrong/absent token is rejected by the
 * database function. Because we always send the COMPLETE state, re-sending
 * after a dropped connection just overwrites with the latest — no replay
 * bookkeeping needed.
 */
export async function pushLiveState(
  code: string,
  token: string,
  currentState: LiveCurrentState,
  displayConfig?: DisplayConfig,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("update_live_game", {
    p_short_code: code,
    p_token: token,
    p_current_state: currentState,
    p_display_config: displayConfig ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Tear a board down for good (token-checked; cascades to the secret row). */
export async function endLiveBoard(code: string, token: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("end_live_game", {
    p_short_code: code,
    p_token: token,
  });
  if (error) throw new Error(error.message);
}
