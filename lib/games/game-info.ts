// ============================================================
// Game Type Info — the human-friendly blurb for each format.
//
// Plain English: the engine's game-types.ts holds only the FACTS the math
// needs (the words, "every chance wins?", "single winner?"). This file holds
// the descriptive copy the UI shows when a vendor picks a game from the
// dropdown — a one-line "what it is / how it's played", a "best for" hint,
// and a couple of quick tags. It's deliberately separate so the pure engine
// metadata stays free of presentation text.
//
// The fuller treatment of every format lives on the /guide page; this is the
// at-a-glance version shown right next to the picker.
// ============================================================

import type { GameType } from "@/lib/types";

export type GameTypeInfo = {
  /** One or two sentences: what it is and how it's played. */
  summary: string;
  /** A short "this format shines when…" hint for the vendor. */
  bestFor: string;
  /** Two or three quick badges (e.g. "Every pack wins", "Most popular in JP"). */
  tags: string[];
  /** Optional caution shown in amber (e.g. razz legality). */
  caution?: string;
};

export const GAME_TYPE_INFO: Record<GameType, GameTypeInfo> = {
  oripa: {
    summary:
      "Sell your own custom mystery packs at a fixed price; every buyer pulls a random set of cards from a finite pool.",
    bestFor: "A controllable card pool with a clear, finite chase.",
    tags: ["Most popular in Japan", "Every pack wins"],
  },
  mysteryBox: {
    summary:
      "A fixed-price sealed box, bag, or pack whose contents vary — the closest US analog to oripa.",
    bestFor: "Selling mixed product (packs, singles, the odd slab) as one surprise.",
    tags: ["Easy to assemble", "Every box wins"],
  },
  wallOfSleeves: {
    summary:
      "Hundreds of identical opaque sleeves; the buyer picks one and wins whatever's inside — cards or a sealed-product voucher.",
    bestFor: "An interactive storefront or convention-table draw.",
    tags: ["High foot-traffic appeal", "Every sleeve wins"],
  },
  slabLot: {
    summary:
      "A pool of opaque graded slabs — known grade, unknown card — built around a high-value chase.",
    bestFor: "Showcasing graded cards at a premium price point.",
    tags: ["Premium price point", "Every slab wins"],
  },
  prizeWheel: {
    summary:
      "Pay (or earn) a spin; the wheel or Plinko board lands on a tiered segment, from a dud up to the top prize.",
    bestFor: "Quick, transparent, crowd-pleasing live play.",
    tags: ["Easiest to run live", "Transparent odds"],
  },
  kuji: {
    summary:
      "Every ticket wins a lettered tier (A, B, C…), and a special “Last One” prize goes to whoever draws the final ticket.",
    bestFor: "Guaranteeing every buyer leaves with something — no total duds.",
    tags: ["Everyone wins a tier", "“Last One” prize"],
  },
  razz: {
    summary:
      "Sell N spots on one item; a single random winner takes it and everyone else gets nothing.",
    bestFor: "Moving one high-value item fast by splitting its cost across buyers.",
    tags: ["Single winner", "One prize, N spots"],
    caution:
      "Razzes are the single-winner format — illegal in most US states without a charitable/gaming license. Check your local rules.",
  },
};

/** Convenience lookup. */
export function gameTypeInfo(type: GameType): GameTypeInfo {
  return GAME_TYPE_INFO[type];
}
