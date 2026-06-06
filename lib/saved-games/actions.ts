// ============================================================
// Saved-games actions — save / list / load / rename / duplicate / delete.
//
// Plain English: these run ON THE SERVER and are the only way the app
// reads or writes a vendor's saved games. Every one of them first checks
// "who is logged in" and refuses if nobody is. On top of that, the
// database's Row-Level Security makes it physically impossible to touch
// another vendor's games — so this is belt-and-suspenders safe.
//
// They're called from the calculator's saved-games bar
// (components/calculator/SavedGamesBar.tsx). Inputs and outputs are plain
// data so they can cross the server↔browser boundary.
// ============================================================

"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type CalculatorSnapshot,
  type GameRow,
  type PrizeItemRow,
  snapshotToGameInsert,
  snapshotToPrizeInserts,
  gameRowToSnapshot,
} from "@/lib/saved-games/serialize";

/** A lightweight row for the "My Games" list (no prize details). */
export type GameSummary = {
  id: string;
  name: string;
  game_type: string;
  updated_at: string;
};

/** Standard result shape: either success with data, or a friendly error. */
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** Get the logged-in user's id, or null if nobody is signed in. */
async function currentUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * List the current user's saved games, most-recently-edited first.
 * Returns an empty list (not an error) when nobody is logged in, so the
 * UI can simply show "log in to save."
 */
export async function listGames(): Promise<Result<GameSummary[]>> {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return { ok: true, data: [] };

  const { data, error } = await supabase
    .from("games")
    .select("id, name, game_type, updated_at")
    .order("updated_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as GameSummary[] };
}

/**
 * Save a NEW game from the current calculator snapshot under `name`.
 * Writes the game row, then its prize rows. Returns the new game's summary.
 */
export async function createGame(
  snapshot: CalculatorSnapshot,
  name: string,
): Promise<Result<GameSummary>> {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return { ok: false, error: "Please log in to save games." };

  // Insert the parent game row (RLS requires user_id = the caller).
  const { data: game, error: gameErr } = await supabase
    .from("games")
    .insert({ ...snapshotToGameInsert(snapshot, name), user_id: userId })
    .select("id, name, game_type, updated_at")
    .single();

  if (gameErr || !game) {
    return { ok: false, error: gameErr?.message ?? "Could not save the game." };
  }

  // Insert the prize rows, if any.
  const items = snapshotToPrizeInserts(snapshot, game.id);
  if (items.length > 0) {
    const { error: itemsErr } = await supabase.from("prize_items").insert(items);
    if (itemsErr) {
      // Roll back the orphaned game so we don't leave a half-saved record.
      await supabase.from("games").delete().eq("id", game.id);
      return { ok: false, error: itemsErr.message };
    }
  }

  return { ok: true, data: game as GameSummary };
}

/**
 * Overwrite an EXISTING game with the current snapshot + name. Updates the
 * game row, then replaces all its prize rows (simplest reliable approach).
 */
export async function updateGame(
  id: string,
  snapshot: CalculatorSnapshot,
  name: string,
): Promise<Result<GameSummary>> {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return { ok: false, error: "Please log in to save games." };

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .update(snapshotToGameInsert(snapshot, name))
    .eq("id", id)
    .select("id, name, game_type, updated_at")
    .single();

  if (gameErr || !game) {
    return { ok: false, error: gameErr?.message ?? "Could not update the game." };
  }

  // Replace the prize rows: delete the old set, insert the new set.
  const { error: delErr } = await supabase
    .from("prize_items")
    .delete()
    .eq("game_id", id);
  if (delErr) return { ok: false, error: delErr.message };

  const items = snapshotToPrizeInserts(snapshot, id);
  if (items.length > 0) {
    const { error: itemsErr } = await supabase.from("prize_items").insert(items);
    if (itemsErr) return { ok: false, error: itemsErr.message };
  }

  return { ok: true, data: game as GameSummary };
}

/**
 * Load a saved game's full state so the calculator can reopen it.
 * Returns the snapshot the editor understands.
 */
export async function loadGame(
  id: string,
): Promise<Result<CalculatorSnapshot>> {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return { ok: false, error: "Please log in to open games." };

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single<GameRow>();
  if (gameErr || !game) {
    return { ok: false, error: gameErr?.message ?? "Game not found." };
  }

  const { data: items, error: itemsErr } = await supabase
    .from("prize_items")
    .select("*")
    .eq("game_id", id);
  if (itemsErr) return { ok: false, error: itemsErr.message };

  return {
    ok: true,
    data: gameRowToSnapshot(game, (items ?? []) as PrizeItemRow[]),
  };
}

/** Rename a saved game in place. */
export async function renameGame(
  id: string,
  name: string,
): Promise<Result<GameSummary>> {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return { ok: false, error: "Please log in." };

  const trimmed = name.trim() || "Untitled game";
  const { data, error } = await supabase
    .from("games")
    .update({ name: trimmed })
    .eq("id", id)
    .select("id, name, game_type, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not rename." };
  }
  return { ok: true, data: data as GameSummary };
}

/**
 * Duplicate a saved game (and all its prizes) under a new "… (copy)" name.
 * Returns the copy's summary.
 */
export async function duplicateGame(
  id: string,
): Promise<Result<GameSummary>> {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return { ok: false, error: "Please log in." };

  // Read the original (RLS guarantees it's the caller's).
  const loaded = await loadGame(id);
  if (!loaded.ok) return loaded;

  const { data: original } = await supabase
    .from("games")
    .select("name")
    .eq("id", id)
    .single();

  const copyName = `${original?.name ?? "Game"} (copy)`;
  return createGame(loaded.data, copyName);
}

/** Permanently delete a saved game (its prizes cascade-delete with it). */
export async function deleteGame(id: string): Promise<Result<{ id: string }>> {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return { ok: false, error: "Please log in." };

  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { id } };
}
