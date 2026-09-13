// ============================================================
// GET /api/cron/sync-sealed — RETIRED (Decision 040, 2026-09-12).
//
// Plain English: this endpoint used to be called by a nightly Vercel Cron and
// fetched tcgcsv.com directly (~435 requests a night from cloud servers).
// tcgcsv is a one-person hobby mirror and the owner's rule is that PokePrice is
// the ONLY program that talks to it. Sealed prices are now refreshed by a job on
// the owner's Mac that reads PokePrice's local mirror:
//   scripts/sync_sealed_from_mirror.py  (launchd: com.mysterycalc.sealed, 07:50)
// The cron entry was removed from vercel.json. This stub stays so a stale link
// or a manual call gets a clear answer instead of a 404 — and can never reach
// tcgcsv.com again. WARNING: do not re-add a direct tcgcsv fetch here.
// ============================================================

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Retired (Decision 040): sealed prices are synced on the owner's Mac from PokePrice's local tcgcsv mirror. This endpoint no longer contacts tcgcsv.com.",
    },
    { status: 410 },
  );
}
