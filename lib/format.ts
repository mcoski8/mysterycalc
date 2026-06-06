// ============================================================
// Formatting helpers — turn raw numbers into human-friendly text.
//
// Plain English: the engine deals in plain numbers (1180, 0.41, 27).
// People read "$1,180", "41%", "27". These tiny pure functions do that
// translation in one place, so every screen shows money and percentages
// the same way. No state, no surprises — easy to reuse and to test.
// ============================================================

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat("en-US");

/**
 * Money for display. Whole-dollar amounts drop the ".00" (so $1,180,
 * not $1,180.00) while anything with cents keeps two decimals
 * ($18.15). Keeps the dashboard tidy without hiding precision.
 */
export function formatUSD(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? usdWhole.format(n) : usd.format(n);
}

/**
 * A margin/rate (stored as a fraction 0–1) shown as a percentage.
 * Whole percentages drop the decimal (41%, not 41.0%); fractional ones
 * keep a single decimal (35.2%). Negative margins show their sign.
 */
export function formatPercent(fraction: number): string {
  if (!Number.isFinite(fraction)) return "—";
  const pct = fraction * 100;
  const rounded = Math.round(pct * 10) / 10; // one decimal place
  const text = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${text}%`;
}

/** A plain count with thousands separators (e.g. 1,000). */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return plain.format(n);
}

/** A multiple like "1.69×" (revenue ÷ pool value). */
export function formatMultiple(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}×`;
}
