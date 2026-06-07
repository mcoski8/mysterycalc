// ============================================================
// /board/[code] — the live, read-only display (point the iPad here).
//
// Plain English: this is the customer-facing scoreboard for one board. It's
// a thin server shell that reads the code from the URL and hands it to the
// interactive <BoardDisplay> (a Client Component, since it subscribes to
// real-time updates). View-only by design — there are no controls here.
// ============================================================

import type { Metadata } from "next";
import { BoardDisplay } from "@/components/live-board/BoardDisplay";
import { normalizeCode } from "@/lib/live-board/code";

export const metadata: Metadata = {
  title: "Live board",
  // A kiosk display shouldn't be indexed.
  robots: { index: false, follow: false },
};

export default async function BoardDisplayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <BoardDisplay code={normalizeCode(code)} />;
}
