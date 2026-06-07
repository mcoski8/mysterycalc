// ============================================================
// WatchQR — a "scan to watch" QR code (read-only, always safe).
//
// Plain English: this draws a QR code that points at a board's PUBLIC
// display URL (e.g. .../board/GHK-7QM). Scanning it opens the watch-only
// page — it grants NO control, so it's safe to print on a card next to the
// iPad. The code never encodes the secret control token.
//
// We render the QR as inline SVG (via qrcode.react), so it's crisp at any
// size, needs no network round-trip, and works offline.
// ============================================================

"use client";

import { QRCodeSVG } from "qrcode.react";

type Props = {
  /** The full public URL the QR should point at. */
  url: string;
  /** Pixel size of the square QR. */
  size?: number;
};

export function WatchQR({ url, size = 132 }: Props) {
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
      <QRCodeSVG
        value={url}
        size={size}
        // Quiet margin around the code so cameras lock on reliably.
        marginSize={2}
        // Medium error-correction: still scannable with a smudge or glare.
        level="M"
        // Always render on white for maximum scan contrast, even in dark mode.
        bgColor="#ffffff"
        fgColor="#1a1a2e"
      />
      <span className="text-xs font-medium text-zinc-600">📷 Scan to watch</span>
    </div>
  );
}
