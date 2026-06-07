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
 */
export function relevanceScore(name: string, query: string): number {
  const n = normalize(name);
  const q = normalize(query);
  if (!n || !q) return 0;

  // Exact and prefix matches are the strongest signals.
  if (n === q) return 1000;
  if (n.startsWith(q)) return 700;

  let score = 0;

  // The whole query appearing as one run (anywhere) is a strong signal.
  if (n.includes(q)) score += 300;

  // Each typed word that appears earns points; appearing at the START of a
  // word ("char" in "charizard") counts for more than mid-word.
  const words = q.split(" ").filter(Boolean);
  for (const w of words) {
    const idx = n.indexOf(w);
    if (idx === -1) continue; // this word isn't present at all
    score += 40;
    const atWordStart = idx === 0 || n[idx - 1] === " ";
    if (atWordStart) score += 25;
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
