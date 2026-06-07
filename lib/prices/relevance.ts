// ============================================================
// Relevance scoring — rank search matches so the best one is on top.
//
// Plain English: the price sources find every product whose name contains the
// words you typed, but "contains" isn't the same as "is what you meant." If
// you type "charizard ex", an item literally named "Charizard ex" should beat
// "Team Up Charizard ex Premium Collection" even though both match. This pure
// function scores a candidate name against the query so the caller can sort
// best-first. Higher score = better match.
//
// It's deliberately simple and framework-free (no fuzzy-match library, no
// network) so it's fast and unit-tested. It rewards, in order: an exact name,
// a name that starts with the query, every typed word appearing at a word
// boundary, the whole query appearing as a run, and shorter (more specific)
// names as a tiebreak.
// ============================================================

/** Lowercase, collapse whitespace — so "  Charizard　EX " compares cleanly. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Score how well `name` matches `query` (both free text). Returns a number
 * where bigger is more relevant; 0 means no typed word appears at all.
 *
 * `extra` is secondary text (e.g. a card's SET name) that also counts toward
 * the match, but at a lower weight than the name — so typing "charizard
 * paldean" finds the "Charizard ex" card from the "Paldean Fates" set, while
 * a card whose NAME contains both words still ranks higher.
 */
export function relevanceScore(name: string, query: string, extra = ""): number {
  const n = normalize(name);
  const q = normalize(query);
  if (!n || !q) return 0;

  // Exact and prefix matches on the NAME are the strongest signals.
  if (n === q) return 1000;
  if (n.startsWith(q)) return 700;

  let score = 0;

  // The whole query appearing as one run in the name is a strong signal.
  if (n.includes(q)) score += 300;

  // The combined haystack (name + set) lets a word match the set when it isn't
  // in the name — but a name match is always worth more than a set match.
  const ex = normalize(extra);
  const words = q.split(" ").filter(Boolean);
  for (const w of words) {
    const nameIdx = n.indexOf(w);
    if (nameIdx !== -1) {
      // Found in the name: full points, with a bonus at a word boundary.
      score += 40;
      if (nameIdx === 0 || n[nameIdx - 1] === " ") score += 25;
      continue;
    }
    // Not in the name — fall back to the set name at reduced weight.
    const exIdx = ex.indexOf(w);
    if (exIdx === -1) continue; // word appears nowhere
    score += 20;
    if (exIdx === 0 || ex[exIdx - 1] === " ") score += 12;
  }

  // No typed word appeared at all → genuinely not a match. Return exactly 0
  // (before the length tiebreak, which would otherwise make it negative).
  if (score === 0) return 0;

  // Tiebreak: prefer shorter, more specific names (a small nudge only, so it
  // never outweighs an actual word match). "Charizard ex" edges out a long
  // bundle name that happens to contain the same words.
  score -= Math.min(n.length, 60) * 0.1;

  return score;
}

/**
 * Sort a list best-match-first by relevance, without mutating the input.
 * `getName` pulls the comparable text from each item. Ties keep their original
 * order (stable), so an upstream order (e.g. newest-first) survives within a
 * relevance bucket.
 */
export function sortByRelevance<T>(
  items: T[],
  query: string,
  getName: (item: T) => string,
): T[] {
  return items
    .map((item, i) => ({ item, i, score: relevanceScore(getName(item), query) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.item);
}
