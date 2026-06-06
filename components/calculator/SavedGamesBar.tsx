// ============================================================
// SavedGamesBar — save the current game and reopen past ones.
//
// Plain English: the strip above the calculator that turns it from a
// throwaway tool into "my games." When logged in, the vendor can Save the
// setup they're looking at, give it a name, and later reopen, rename,
// duplicate, or delete any saved game. Logged out, it just invites them to
// log in (the calculator itself still works without an account).
//
// It owns no math and no database code — it calls the server actions in
// lib/saved-games/actions.ts and tells Calculator to load a snapshot back
// into the editor.
// ============================================================

"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Save,
  FilePlus2,
  FolderOpen,
  Copy,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  listGames,
  createGame,
  updateGame,
  loadGame,
  renameGame,
  duplicateGame,
  deleteGame,
  type GameSummary,
} from "@/lib/saved-games/actions";
import type { CalculatorSnapshot } from "@/lib/saved-games/serialize";

type Props = {
  /** The calculator's current state, ready to save. */
  snapshot: CalculatorSnapshot;
  /** Push a loaded game's state back into the calculator. */
  onLoad: (snapshot: CalculatorSnapshot) => void;
  /** The logged-in vendor's email, or null when signed out. */
  userEmail: string | null;
};

export function SavedGamesBar({ snapshot, onLoad, userEmail }: Props) {
  const loggedIn = Boolean(userEmail);

  // The saved-games list and which one (if any) is currently open.
  const [games, setGames] = useState<GameSummary[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  // UI state: the expandable list, the "name this game" box, inline rename,
  // a transient error, and a pending flag while a server action runs.
  const [listOpen, setListOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openGame = games.find((g) => g.id === openId) ?? null;

  // Load the vendor's games once they're logged in. (When logged out the
  // component renders the "log in" view below, so list state is unused —
  // no need to clear it here.)
  useEffect(() => {
    if (!loggedIn) return;
    startTransition(async () => {
      const res = await listGames();
      if (res.ok) setGames(res.data);
      else setError(res.error);
    });
  }, [loggedIn]);

  // ---- Actions ----

  // Save: overwrite the open game if there is one, else start naming a new one.
  function handleSave() {
    setError(null);
    if (openGame) {
      startTransition(async () => {
        const res = await updateGame(openGame.id, snapshot, openGame.name);
        if (!res.ok) return setError(res.error);
        setGames((gs) => sortByUpdated(replace(gs, res.data)));
      });
    } else {
      setNaming(true);
      setNameDraft("");
    }
  }

  // Confirm the name box → create a brand-new saved game.
  function handleConfirmName() {
    const name = nameDraft.trim() || "Untitled game";
    setError(null);
    startTransition(async () => {
      const res = await createGame(snapshot, name);
      if (!res.ok) return setError(res.error);
      setGames((gs) => sortByUpdated([res.data, ...gs]));
      setOpenId(res.data.id);
      setNaming(false);
    });
  }

  // "Save as new" → always create a fresh copy, even if a game is open.
  function handleSaveAsNew() {
    setNaming(true);
    setNameDraft(openGame ? `${openGame.name} (copy)` : "");
  }

  function handleOpen(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await loadGame(id);
      if (!res.ok) return setError(res.error);
      onLoad(res.data);
      setOpenId(id);
      setListOpen(false);
    });
  }

  function handleDuplicate(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await duplicateGame(id);
      if (!res.ok) return setError(res.error);
      setGames((gs) => sortByUpdated([res.data, ...gs]));
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteGame(id);
      if (!res.ok) return setError(res.error);
      setGames((gs) => gs.filter((g) => g.id !== id));
      if (openId === id) setOpenId(null);
    });
  }

  function handleRename(id: string) {
    const name = editDraft.trim();
    setError(null);
    startTransition(async () => {
      const res = await renameGame(id, name);
      if (!res.ok) return setError(res.error);
      setGames((gs) => sortByUpdated(replace(gs, res.data)));
      setEditingId(null);
    });
  }

  // ---- Logged-out view ----
  if (!loggedIn) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          Want to keep this game? Log in to save and reuse your setups.
        </span>
        <Link href="/login" className={buttonVariants({ size: "sm", variant: "outline" })}>
          Log in to save
        </Link>
      </div>
    );
  }

  // ---- Logged-in view ----
  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted-foreground">
          {openGame ? (
            <>
              Editing <span className="font-medium text-foreground">{openGame.name}</span>
            </>
          ) : (
            "Unsaved game"
          )}
        </span>

        <Button size="sm" onClick={handleSave} disabled={pending}>
          <Save className="size-4" /> {openGame ? "Save" : "Save game"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleSaveAsNew} disabled={pending}>
          <FilePlus2 className="size-4" /> Save as new
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setListOpen((o) => !o)}
          disabled={pending}
        >
          <FolderOpen className="size-4" /> My games ({games.length})
        </Button>
      </div>

      {/* Name-a-new-game box */}
      {naming && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            autoFocus
            className="max-w-xs"
            placeholder="Name this game (e.g. Indy Regionals wall)"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirmName();
              if (e.key === "Escape") setNaming(false);
            }}
          />
          <Button size="sm" onClick={handleConfirmName} disabled={pending}>
            <Check className="size-4" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setNaming(false)}>
            <X className="size-4" /> Cancel
          </Button>
        </div>
      )}

      {/* Error notice */}
      {error && (
        <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </p>
      )}

      {/* The saved-games list */}
      {listOpen && (
        <div className="rounded-md border bg-background">
          {games.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No saved games yet. Build a game above and hit “Save game.”
            </p>
          ) : (
            <ul className="divide-y">
              {games.map((g) => (
                <li key={g.id} className="flex items-center gap-2 px-3 py-2">
                  {editingId === g.id ? (
                    <>
                      <Input
                        autoFocus
                        className="h-8 max-w-xs"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(g.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button size="icon" variant="ghost" aria-label="Save name" onClick={() => handleRename(g.id)}>
                        <Check className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Cancel rename" onClick={() => setEditingId(null)}>
                        <X className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="flex-1 truncate text-left text-sm font-medium hover:underline"
                        onClick={() => handleOpen(g.id)}
                        title="Open this game"
                      >
                        {g.name}
                        {g.id === openId && (
                          <Badge variant="secondary" className="ml-2 align-middle">
                            open
                          </Badge>
                        )}
                      </button>
                      <Button size="icon" variant="ghost" aria-label="Open" onClick={() => handleOpen(g.id)} disabled={pending}>
                        <FolderOpen className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Rename"
                        onClick={() => {
                          setEditingId(g.id);
                          setEditDraft(g.name);
                        }}
                        disabled={pending}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Duplicate" onClick={() => handleDuplicate(g.id)} disabled={pending}>
                        <Copy className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => handleDelete(g.id)} disabled={pending}>
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Small pure list helpers (keep the handlers above readable) ----

/** Replace a game in the list with its updated version. */
function replace(games: GameSummary[], updated: GameSummary): GameSummary[] {
  return games.map((g) => (g.id === updated.id ? updated : g));
}

/** Sort newest-edited first, matching the "My Games" server ordering. */
function sortByUpdated(games: GameSummary[]): GameSummary[] {
  return [...games].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
