// ============================================================
// ManualPriceSource — the "no lookup, just type it" provider.
//
// Plain English: this source never finds anything. It exists so the app
// always has a valid PriceSource even when automatic lookup is turned off or
// unavailable — the vendor simply types the market value, exactly as in
// Phase 1. It's the guaranteed fallback the whole feature is built around.
// ============================================================

import type { PriceCandidate, PriceSource } from "@/lib/prices/types";

export class ManualPriceSource implements PriceSource {
  readonly id = "manual";

  /** Always returns no candidates → the UI shows a plain value input. */
  async search(): Promise<PriceCandidate[]> {
    return [];
  }
}
