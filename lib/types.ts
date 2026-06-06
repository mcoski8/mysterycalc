// ============================================================
// Shared Types — the vocabulary the whole app speaks.
//
// Plain English: before we can do any math, we need agreed-upon
// shapes for "a prize," "a game setup," and "the answer." These
// types are that shared dictionary. The calculation engine, the
// prize-pool helpers, and (later) the UI all import from here, so
// there is exactly one definition of each idea.
//
// Nothing in this file does anything — it only describes shapes.
// The economics live in `lib/engine/`; the game-specific quirks
// live in `lib/games/`; the pool bookkeeping lives in `lib/pool/`.
// ============================================================

/**
 * What kind of thing a prize is. This is only used for labels and
 * grouping on screen / on the odds sheet — it does NOT change any
 * math. A "voucher" (e.g. "you won an ETB") is treated as an item
 * worth whatever it redeems for.
 */
export type PrizeType =
  | "pack"
  | "sealed"
  | "single"
  | "slab"
  | "voucher"
  | "filler";

/**
 * One line in the vendor's prize pool — a kind of prize and how many
 * of it are in the game. Carries TWO values on purpose:
 *  - marketValue: what it's worth (drives the advertised pool size V
 *    and the player's odds).
 *  - cost: what the vendor paid (drives true profit).
 * Conflating these two is the classic mistake this tool prevents.
 */
export type PrizeItem = {
  /** Stable id for UI list keys. The engine ignores it. */
  id: string;
  name: string;
  type: PrizeType;
  /** Per-unit market value (what one of these is worth). */
  marketValue: number;
  /** Per-unit cost to the vendor (what one of these cost them). */
  cost: number;
  /** How many of this item are in the pool. */
  quantity: number;
  /** True if this line is the auto-managed "filler" (see lib/pool). */
  isFiller?: boolean;
};

/** The finite-pool game family v1 supports (see lib/games). */
export type GameType =
  | "oripa"
  | "mysteryBox"
  | "wallOfSleeves"
  | "slabLot"
  | "prizeWheel"
  | "kuji"
  | "razz";

/**
 * The per-game-type facts the rest of the app needs. All v1 games run
 * on the SAME margin math; what differs is wording and two structural
 * flags (does every chance win? is there a single winner?).
 */
export type GameTypeMeta = {
  id: GameType;
  displayName: string;
  /** What to call one "chance" on screen: sleeve, ticket, spin, spot… */
  chanceWord: string;
  /** Plural of chanceWord, when not just chanceWord + "s". */
  chanceWordPlural: string;
  /** Every chance yields exactly one prize → Σ(quantities) must equal N. */
  everyChanceWins: boolean;
  /** Whether the auto-balancing "filler" concept applies to this type. */
  allowsFiller: boolean;
  /** Razz/raffle: one prize, N chances, exactly one winner. */
  singleWinner: boolean;
  /** A gentle starting margin to suggest in the UI (fraction 0–1). */
  defaultMargin: number;
};

/**
 * Which of the three locked-together knobs {price, chances, margin}
 * the engine should compute. The caller supplies the other two.
 */
export type SolveFor = "buyIn" | "chances" | "targetMargin";

/**
 * A game setup handed to the engine. Provide EXACTLY TWO of
 * {buyIn, chances, targetMargin}; leave the third undefined and the
 * engine solves it. `solveFor` says explicitly which one to solve, so
 * there's no guessing if a value happens to be present.
 */
export type GameConfig = {
  gameType: GameType;
  solveFor: SolveFor;
  /** P — price per chance. Required unless solveFor === "buyIn". */
  buyIn?: number;
  /** N — number of chances. Required unless solveFor === "chances". */
  chances?: number;
  /** m — target margin, 0–1. Required unless solveFor === "targetMargin". */
  targetMargin?: number;
};

/**
 * How the engine sorts prizes into "chase / win / dud" buckets,
 * relative to the buy-in P. These are sensible defaults, not laws —
 * the UI may expose them later.
 */
export type TierThresholds = {
  /** value > chaseMultiple × P  ⇒  "chase". Default 5. */
  chaseMultiple: number;
};

/** One prize's odds line, the raw data the customer odds sheet renders. */
export type PrizeOdds = {
  name: string;
  quantity: number;
  /** quantity ÷ N — the chance of drawing this exact prize. */
  probability: number;
};

/** A simple, human read of how swingy the game feels. */
export type Volatility = "low" | "medium" | "high";

/**
 * The engine's answer: every number a vendor needs to judge a game,
 * plus any non-fatal warnings worth showing. (Fatal problems are
 * thrown as EngineError instead — see lib/engine.)
 */
export type GameResult = {
  // --- The pool ---
  poolValue: number; // V = Σ(marketValue × qty)
  poolCost: number; // C = Σ(cost × qty)
  prizeCount: number; // Σ(qty) — the units actually in the pool
  // --- The three locked knobs (given or solved) ---
  chances: number; // N
  buyIn: number; // P
  marginPct: number; // m, as a fraction 0–1 (realized at the final N, P)
  solvedFor: SolveFor; // which knob the engine computed
  // --- The money story ---
  revenue: number; // R = N × P (full sellout)
  profit: number; // R − C (uses COST, not market value)
  poolMultiple: number; // R ÷ V (how many "pools" of revenue you take in)
  playerAvgValue: number; // V ÷ N (average prize value per chance)
  breakEvenChances: number; // ceil(C ÷ P) — chances that must sell to cover cost
  // --- The "feel" of the game ---
  hitRate: number; // fraction of chances worth ≥ P
  tiers: { chase: number; win: number; dud: number }; // counts of chances
  volatility: Volatility;
  perPrizeOdds: PrizeOdds[];
  // --- Anything the vendor should notice but isn't fatal ---
  warnings: string[];
};
