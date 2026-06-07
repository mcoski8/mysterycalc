// ============================================================
// Sealed-products sync — copy tcgcsv's sealed catalog into our table.
//
// Plain English: tcgcsv.com hands out TCGPlayer's whole catalog as bulk files,
// not a search API. This job downloads those files, keeps only the SEALED
// product that has a price (booster boxes, ETBs, packs, bundles…), and writes a
// tidy row per product into our `sealed_products` table so the app can search
// it by name. It re-discovers product AND refreshes prices every run, so new
// sets appear automatically and prices stay current.
//
// It's fast: ~5 seconds for all ~217 sets (two small downloads per set), so the
// nightly Vercel Cron runs the whole thing well inside the 60s cap — no need to
// split "discover" from "refresh". (We measured 4.6s; over-engineering a
// lighter mode would buy nothing.)
//
// Politeness (tcgcsv is a free hobby host): we send an identifying User-Agent
// and fetch at most CONCURRENCY sets in parallel — mirrors PokeHolder's sync.
//
// FRAGILE: depends on tcgcsv's URL shape + uptime and on TCGPlayer's catalog
// conventions. The classifier (isSealed) is the brittle part and is unit-tested
// separately. Callers should treat a thrown error as "sync failed, try later."
// ============================================================

// Relative imports (not the @/ alias) so the local `tsx` script resolves these
// without needing tsconfig-path support.
import { adminClient } from "./db";
import { isSealed, productType, type ExtendedDatum } from "./classify";

// Category 3 = Pokémon on tcgcsv. Same base PokeHolder uses.
const BASE = "https://tcgcsv.com/tcgplayer/3";
const UA =
  "MysteryCalc/1.0 (+https://github.com/mcoski8/mysterycalc; sealed price sync; contact mcoski@gmail.com)";
const CONCURRENCY = 6; // parallel set fetches — polite to a hobby host.
const UPSERT_CHUNK = 500; // rows per DB write.

// ---- tcgcsv payload shapes (the slim subset we read) ----
type Group = { groupId: number; name?: string };
type Product = {
  productId: number;
  name?: string;
  cleanName?: string;
  imageUrl?: string | null;
  extendedData?: ExtendedDatum[] | null;
};
type PriceRow = {
  productId: number;
  subTypeName?: string | null;
  marketPrice?: number | null;
  lowPrice?: number | null;
};

export type SyncStats = {
  groupsScanned: number;
  sealedFound: number; // priced sealed products written
  durationMs: number;
};

type Logger = (msg: string) => void;
const noop: Logger = () => {};

/** Fetch a tcgcsv JSON endpoint; unwrap its `{ success, results }` envelope. */
async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    // Always hit the source; this job is the thing that refreshes our cache.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  const body = (await res.json()) as { results?: T } | T;
  return (body as { results?: T }).results ?? (body as T);
}

/** Run async `fn` over `items` with a fixed-size concurrency pool. */
async function mapPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) || 1 }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx]);
      }
    }),
  );
}

/**
 * Pick the one price row to trust for a sealed product. Sealed product is sold
 * as "Normal" (no foil variants), so prefer that; otherwise take the first row
 * that actually has a market price. Returns null if none has a price.
 */
function bestPrice(rows: PriceRow[]): PriceRow | null {
  const priced = rows.filter((r) => typeof r.marketPrice === "number" && r.marketPrice! > 0);
  if (priced.length === 0) return null;
  return priced.find((r) => (r.subTypeName ?? "").toLowerCase() === "normal") ?? priced[0];
}

/** Write rows to the table in bounded chunks, upserting on product_id. */
async function upsert(rows: Record<string, unknown>[], log: Logger): Promise<void> {
  if (rows.length === 0) return;
  const sb = adminClient();
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const batch = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await sb
      .from("sealed_products")
      .upsert(batch, { onConflict: "product_id" });
    if (error) throw new Error(`upsert sealed_products: ${error.message}`);
    log(`  wrote ${Math.min(i + batch.length, rows.length)}/${rows.length} rows`);
  }
}

/**
 * Run the sync. Walks every Pokémon set (or just `groupIds` for testing),
 * keeps the priced sealed product, and upserts a full row per product.
 * Returns counts so the script/route can report what happened.
 */
export async function syncSealed(opts: {
  /** Limit to specific tcgcsv group ids (testing). Defaults to all sets. */
  groupIds?: number[];
  /** Fetch + classify but DON'T write (the script's --dry flag). */
  dryRun?: boolean;
  log?: Logger;
} = {}): Promise<SyncStats> {
  const log = opts.log ?? noop;
  const startedAt = Date.now();
  const now = new Date().toISOString();

  const all = await getJson<Group[]>("/groups");
  const groups = opts.groupIds ? all.filter((g) => opts.groupIds!.includes(g.groupId)) : all;
  log(`Scanning ${groups.length} set(s) for sealed product…`);

  // One full row per priced sealed product, across all chosen sets.
  const rows: Record<string, unknown>[] = [];
  let sealedFound = 0;

  await mapPool(groups, CONCURRENCY, async (group) => {
    // Fetch this set's prices and products. A failure on either skips just this
    // set (the rest still sync) — never aborts the whole run.
    let prices: PriceRow[];
    let products: Product[];
    try {
      [prices, products] = await Promise.all([
        getJson<PriceRow[]>(`/${group.groupId}/prices`),
        getJson<Product[]>(`/${group.groupId}/products`),
      ]);
    } catch (err) {
      log(`  ! set ${group.groupId} fetch failed: ${(err as Error).message}`);
      return;
    }

    const priceByProduct = new Map<number, PriceRow[]>();
    for (const p of prices) {
      const arr = priceByProduct.get(p.productId);
      if (arr) arr.push(p);
      else priceByProduct.set(p.productId, [p]);
    }

    for (const prod of products) {
      if (!isSealed(prod.extendedData)) continue; // singles + code cards skipped.
      const best = bestPrice(priceByProduct.get(prod.productId) ?? []);
      if (!best) continue; // no price → useless as a prize value; skip.
      rows.push({
        product_id: prod.productId,
        name: prod.name ?? "Unknown sealed product",
        clean_name: prod.cleanName ?? null,
        set_name: group.name ?? null,
        group_id: group.groupId,
        image_url: prod.imageUrl ?? null,
        market_price: best.marketPrice,
        low_price: best.lowPrice ?? null,
        product_type: productType(prod.name),
        prices_updated_at: now,
        synced_at: now,
      });
      sealedFound++;
    }
  });

  log(`Found ${sealedFound} priced sealed product(s).`);

  if (opts.dryRun) {
    log("DRY run — no writes.");
  } else {
    await upsert(rows, log);
  }

  return { groupsScanned: groups.length, sealedFound, durationMs: Date.now() - startedAt };
}
