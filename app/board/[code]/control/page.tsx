// ============================================================
// /board/[code]/control — the vendor's phone remote (control panel).
//
// Plain English: a thin server shell that reads the board code from the URL
// and hands it to the interactive <BoardController> (a Client Component,
// since it manages taps, optimistic state, and offline re-sync). Only the
// phone that started the board holds the control token, so even though this
// URL is reachable by anyone, it shows a "you don't control this board"
// message unless this device has the token saved.
// ============================================================

import type { Metadata } from "next";
import { BoardController } from "@/components/live-board/BoardController";
import { normalizeCode } from "@/lib/live-board/code";

export const metadata: Metadata = {
  title: "Control board",
  robots: { index: false, follow: false },
};

export default async function BoardControlPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <BoardController code={normalizeCode(code)} />
    </main>
  );
}
