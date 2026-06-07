// ============================================================
// JoinBoardForm — type a code to watch a board (the iPad's way in).
//
// Plain English: on the iPad you open /board and type the short code the
// vendor's phone is showing (e.g. GHK-7QM). This tidies what you type and
// sends you to that board's read-only display. It grants no control — it's
// just the front door for watchers.
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isCompleteCode, normalizeCode } from "@/lib/live-board/code";

export function JoinBoardForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const ready = isCompleteCode(code);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    router.push(`/board/${normalizeCode(code)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="join-code">Board code</Label>
        <Input
          id="join-code"
          value={code}
          onChange={(e) => setCode(normalizeCode(e.target.value))}
          placeholder="GHK-7QM"
          autoCapitalize="characters"
          autoComplete="off"
          inputMode="text"
          maxLength={7}
          className="text-center font-mono text-2xl tracking-widest"
        />
        <p className="text-xs text-muted-foreground">
          Find this on the controlling phone (or scan its QR code).
        </p>
      </div>
      <Button type="submit" disabled={!ready} size="lg" className="h-11 w-full">
        Watch board
      </Button>
    </form>
  );
}
