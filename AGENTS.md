<!-- Always-on rules for AI assistants working in this repo. Claude Code auto-loads
     this file (via the root CLAUDE.md pointer) at the start of every session. Keep it
     SHORT — the full context lives in docs/CLAUDE.md. -->

# MysteryCalc — Agent Rules (read every session)

1. **Read `docs/CLAUDE.md` FIRST**, then `docs/CURRENT_PHASE.md`, then the active sprint file. `docs/CLAUDE.md` is the master context; if anything here and there conflict, `docs/CLAUDE.md` wins until deliberately updated.

2. **The owner is non-technical** but drives Claude Code comfortably. For any manual step (terminal command, account setup, dashboard click), give click-by-click instructions and say what they should expect to see.

3. **Documentation discipline is mandatory** (mirrors the PokeSentry / PokeHolder system):
   - `DECISIONS_LOG.md`, `handoff/`, and sprint session-logs are **append-only — never edit or delete past entries.** Supersede a decision with a new one; don't rewrite history.
   - `CURRENT_PHASE.md` is **rewritten** (not appended) at the end of every session.
   - Close a session by following `docs/session-end-prompt.md` line by line.

4. **Code-commenting standard (HARD RULE — the owner asked for this explicitly):** write comments so that **both a developer and a semi-non-technical reader** can follow what's happening. Every module/file gets a plain-English header block ("what this does, why it exists"); every non-obvious function gets a one-line plain-English summary above it; the **math is labeled in words** (not just symbols); use `WARNING:` / `GOTCHA:` / `FRAGILE:` tags for traps. Comment the **WHY**, not the obvious "what." Full standard + examples in `docs/CLAUDE.md` § "Code Commenting Standard."

5. **Next.js here is the latest version — newer than your training.** Before writing app code, check the bundled docs in `node_modules/next/dist/docs/` (once installed) and heed deprecation notices. Don't assume older App Router conventions.

6. **Stay in the current phase.** Don't write later-phase code (e.g. auth/DB) while the phase gate before it is unmet. Phases + exit criteria are in `docs/CLAUDE.md`.

7. **Honor the locked scope.** v1 is the finite-pool game family with manual entry. Live Box Breaks are deferred; claw machines are out. Don't add paid dependencies or new scope without a logged decision.
