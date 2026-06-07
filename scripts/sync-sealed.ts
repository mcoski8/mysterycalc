// ============================================================
// Local sealed-product sync — populate / refresh the sealed_products table.
//
// Plain English: run this to fill our search table with sealed product (booster
// boxes, ETBs, packs…) and their TCGPlayer market prices, downloaded from
// tcgcsv.com. Run it the first time to populate, and again whenever new Pokémon
// sets are released (so the new boxes/ETBs become searchable). The nightly
// Vercel Cron keeps PRICES fresh on its own; this script is for the heavier
// "discover new product" pass, with no time limit.
//
// Run from the project root (reads keys from .env.local):
//   npx tsx scripts/sync-sealed.ts            sync all sets
//   npx tsx scripts/sync-sealed.ts --dry      fetch + classify, no DB writes
//   GROUPS=24587 npx tsx scripts/sync-sealed.ts   only that set (testing)
//
// The nightly Vercel Cron runs this same sync on its own, so you normally don't
// need to. Run it by hand for the first populate, or to refresh immediately.
//
// WARNING: needs SUPABASE_SERVICE_ROLE_KEY in .env.local (it writes the table).
// That key is a secret — .env.local is gitignored; never commit it.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncSealed } from "../lib/sealed/sync";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Load .env.local into process.env so the Supabase clients can read the keys. */
function loadEnvLocal(): void {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) {
    console.error("No .env.local found — cannot read Supabase keys.");
    process.exit(1);
  }
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function main() {
  loadEnvLocal();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry");
  const groupIds = process.env.GROUPS
    ? process.env.GROUPS.split(",").map((g) => Number(g.trim())).filter(Boolean)
    : undefined;

  console.log(`\nSealed sync${dryRun ? " (dry)" : ""}${groupIds ? ` groups=${groupIds.join(",")}` : ""}\n`);

  const stats = await syncSealed({ dryRun, groupIds, log: (m) => console.log(m) });

  console.log(
    `\nDone in ${(stats.durationMs / 1000).toFixed(1)}s — scanned ${stats.groupsScanned} set(s), ` +
      `${stats.sealedFound} sealed product${dryRun ? " (not written)" : " written"}.`,
  );
}

main().catch((err) => {
  console.error("\nSync failed:", err.message ?? err);
  process.exit(1);
});
