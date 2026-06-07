// ============================================================
// Sealed-product classification — pure rules, no network, no DB.
//
// Plain English: the tcgcsv catalog mixes everything together — single cards,
// digital "code cards", and SEALED product (booster boxes, ETBs, packs). This
// file decides which catalog rows are sealed product (the only kind we index)
// and gives each one a tidy type label for the picker.
//
// It is PURE on purpose: deciding "is this sealed?" is the riskiest rule in the
// feature, so it lives apart from the fetching/DB code and is unit-tested
// against real edge cases (`tests/sealed-classify.test.ts`).
//
// HOW WE TELL SEALED FROM A SINGLE (empirically validated, Decision 032):
//   Every product carries an `extendedData` list of {name,value} facts.
//   - A SINGLE card always has a "Number" fact (its collector number).
//   - A digital "Code Card" has a "Rarity" fact but no "Number".
//   - SEALED product has NEITHER "Number" NOR "Rarity".
//   So: sealed  ==  (no "Number"  AND  no "Rarity").
//   This was checked live across sets from Base Set (1999) to 2026 — including
//   Jumbo Cards (333 products) and promo sets (283) where it produced ZERO
//   false positives (those all carry Number/Rarity, so none leak in as sealed).
//   GOTCHA: do NOT additionally require a name keyword to "confirm" sealed —
//   real sealed items like "2-Player Starter Set" and "Celebrations Collector
//   Chest" have no obvious keyword and would be wrongly dropped. Field-absence
//   is the gate; keywords below are only for the cosmetic type LABEL.
// ============================================================

/** One {name, value} fact from a tcgcsv product's `extendedData` array. */
export type ExtendedDatum = { name?: string | null; value?: string | null };

/**
 * Is this catalog product a SEALED product (vs. a single card or code card)?
 * Rule: it has neither a "Number" nor a "Rarity" extended-data field.
 */
export function isSealed(extendedData: ExtendedDatum[] | null | undefined): boolean {
  if (!extendedData) return true; // no facts at all → not a single → treat as sealed
  const fields = new Set(
    extendedData.map((e) => (e?.name ?? "").trim().toLowerCase()),
  );
  return !fields.has("number") && !fields.has("rarity");
}

// Name patterns → a clean product-type label, tried in order (first match wins).
// Order matters: "Elite Trainer Box" must beat the generic "Box"; "Booster
// Box" must beat "Booster Pack" isn't an issue since each is checked explicitly.
// These only drive a cosmetic badge — an unmatched product is still indexed as
// "Other", never excluded (see GOTCHA above).
const TYPE_RULES: { label: string; pattern: RegExp }[] = [
  { label: "Pokémon Center ETB", pattern: /pokemon center elite trainer box|pokemon center etb/i },
  { label: "Elite Trainer Box", pattern: /elite trainer box|\betb\b/i },
  { label: "Booster Box", pattern: /booster box/i },
  { label: "Build & Battle", pattern: /build & battle|build and battle/i },
  { label: "Booster Bundle", pattern: /booster bundle|booster.*bundle/i },
  { label: "Blister", pattern: /blister|checklane/i },
  { label: "Booster Pack", pattern: /booster pack|\bpack\b/i },
  { label: "Tin", pattern: /\btin\b/i },
  { label: "Collection", pattern: /collection|\bbox\b|chest|premium/i },
  { label: "Starter / Deck", pattern: /starter|theme deck|battle deck|\bdeck\b/i },
];

/**
 * Turn a sealed product's name into a short, friendly type label for the
 * picker badge (e.g. "Booster Box", "Elite Trainer Box"). Falls back to
 * "Other" when nothing matches — the product is still listed and searchable.
 */
export function productType(name: string | null | undefined): string {
  const n = (name ?? "").trim();
  if (!n) return "Other";
  for (const rule of TYPE_RULES) {
    if (rule.pattern.test(n)) return rule.label;
  }
  return "Other";
}
