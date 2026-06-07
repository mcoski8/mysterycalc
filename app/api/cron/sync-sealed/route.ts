// ============================================================
// GET /api/cron/sync-sealed — the nightly sealed-price refresh.
//
// Plain English: once a day, Vercel calls this URL on a schedule (set in
// vercel.json). It re-syncs sealed product from tcgcsv — refreshing prices AND
// picking up any newly released boxes/ETBs — so the values the app auto-fills
// stay current with zero effort from anyone. The whole sync takes ~5s, well
// inside Vercel's time limit, so it does the full job (no split needed).
//
// SECURITY: this endpoint WRITES the database, so it must not be open to the
// public. It only runs when the caller proves it's our cron by sending the
// secret in `Authorization: Bearer <CRON_SECRET>`. Vercel adds this header
// automatically for scheduled crons when CRON_SECRET is set in the project's
// env vars; a manual run must send it by hand. No secret set → we refuse.
// ============================================================

import { NextResponse } from "next/server";
import { syncSealed } from "@/lib/sealed/sync";

// Module state + outbound fetches need the Node runtime; never static.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Cap the run so a stuck upstream can't hang the function. 60s is the Hobby
// ceiling; the full sync fits comfortably (it measured ~5s).
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: if no secret is configured, the endpoint is disabled entirely.
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Sync endpoint disabled — CRON_SECRET is not set." },
      { status: 503 },
    );
  }
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Reject anything else.
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const stats = await syncSealed();
    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? "Sync failed." },
      { status: 500 },
    );
  }
}
