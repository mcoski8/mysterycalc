// ============================================================
// EngineError — how the math layer says "no" loudly.
//
// Plain English: a core rule of this project is that bad inputs must
// FAIL VISIBLY, never quietly return a wrong number. When the engine
// or the pool helpers hit something they can't compute (an empty
// pool, a margin of 100%, more prizes than chances), they throw one
// of these. It carries a short machine-readable `code` (handy for the
// UI to react to) plus a plain-English message for the vendor.
// ============================================================

/** Stable identifiers for each kind of fatal problem. */
export type EngineErrorCode =
  | "EMPTY_POOL"
  | "INVALID_QUANTITY"
  | "INVALID_VALUE"
  | "MISSING_INPUTS"
  | "MARGIN_TOO_HIGH"
  | "NON_POSITIVE_PRICE"
  | "NON_POSITIVE_CHANCES"
  | "PRIZES_EXCEED_CHANCES"
  | "RAZZ_PRIZE_COUNT";

export class EngineError extends Error {
  code: EngineErrorCode;

  constructor(code: EngineErrorCode, message: string) {
    super(message);
    this.name = "EngineError";
    this.code = code;
  }
}
