// ============================================================
// Live Game Board — pairing-code formatting (pure helper).
//
// Plain English: board codes look like "GHK-7QM" — six letters/numbers
// with a dash in the middle, from an alphabet with no easily-confused
// characters (no O/0/I/1). People type them in messy ways (lowercase, no
// dash, stray spaces), so this tidies whatever they type into the exact
// shape the database stored. Used by the join screen and the board routes.
// ============================================================

/**
 * Normalize a typed/pasted code to the canonical "XXX-XXX" form.
 * Uppercases, drops anything that isn't a letter or digit, and re-inserts
 * the dash once there are six characters. Shorter input is returned as-is
 * (uppercased) so the field can show progress as the user types.
 */
export function normalizeCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length === 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return cleaned;
}

/** True when a code is a complete, well-formed pairing code. */
export function isCompleteCode(raw: string): boolean {
  return /^[A-Z0-9]{6}$/.test(raw.toUpperCase().replace(/[^A-Z0-9]/g, ""));
}
