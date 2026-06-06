# Session End Prompt

> **Usage:** Copy everything below the line and paste it to Claude Code when you're ready to end a session.
> **This file is a static template — do not modify it during normal sessions; just copy and paste.**

---

Before ending this session, complete the following pre-flight checks and documentation updates.

## Pre-Flight Checks

Run **only the checks relevant** to what was touched this session. Skip what doesn't apply.

### If app / library code was touched:
1. **Type-check:** `npm run typecheck` (or `tsc --noEmit`).
2. **Lint:** `npm run lint`.
3. **Tests:** `npm test` — especially the calculation-engine tests in `tests/` (the engine is the product).
4. **Build:** `npm run build` — confirm it compiles cleanly.

### If a Supabase migration was added:
1. Confirm the migration applies cleanly to the dev project.
2. Confirm row-level security still allows the intended reads and blocks unintended writes.

### If anything was deployed:
1. Confirm the Vercel deploy succeeded and the app loads at its URL.

### Always:
1. **Uncommitted changes:** `git status` — commit what should be committed; clean up what shouldn't be in
   the repo. **Never commit `.env*` files or keys.**
2. **Branch state:** if on a feature branch, note where it is.
3. **Commit + push to `origin/main` — MANDATORY every session** (owner enabled 2026-06-05, Decision 019).
   Session-end pushes are **pre-authorized** — attempt the push without asking. Remote:
   `https://github.com/mcoski8/mysterycalc`. (A sandbox/network block on the push is not the owner
   reconsidering — report it and move on.)

If any check fails, **fix it before updating docs.** Leave the project in a known-good state.

## Documentation Updates

Once pre-flight passes, update these in order:

1. **Active sprint file** (`docs/sprints/sN-*.md`):
   - Update task statuses (Pending → In Progress → Done).
   - Append a session log entry: date, what was completed (with file paths), decisions, gotchas, files
     created/modified.

2. **`docs/CURRENT_PHASE.md`** — **REWRITE entirely** (do not append):
   - Current phase + sprint + status; what was completed; in progress vs. not started; blockers; gotchas;
     immediate next actions (numbered); which handoff file is active; and a paste-ready **Resume Prompt** at
     the bottom.

3. **`docs/handoff/MASTER_HANDOFF_NN.md`** (active handoff) — **APPEND** a session entry:
   - `## Session N — YYYY-MM-DD — Short title`
   - What we accomplished (file paths); what was decided (cross-ref DECISIONS_LOG.md); what's open / next;
     landmines / gotchas the next session needs.

4. **`docs/DECISIONS_LOG.md`** — **APPEND** any non-trivial decisions (next number; Date, Question, Options,
   Choice, Why). **Append only — never edit past entries.**

5. **`docs/checklist.md`** — check off `[x]` completed tasks.

6. **`docs/sprints/SPRINT_INDEX.md`** — update if a sprint's or phase's status changed.

7. **If a module was created or substantially changed:** update its `docs/modules/*.md` and the
   file-structure / phase sections of `docs/CLAUDE.md` if needed.

## Handoff File Size Check

Check the active `MASTER_HANDOFF` file size. If it exceeds ~15KB:
- Close it with a summary header: "Covers sessions X–Y. [one-line summary]."
- Create the next numbered file (e.g. `MASTER_HANDOFF_02.md`).
- Point `CURRENT_PHASE.md` at the new file.

## Final Confirmation

After updating ALL files:
1. State explicitly: "Documentation updated. All pre-flight checks pass. Ready to end session."
2. Provide the **Resume Prompt** from `docs/CURRENT_PHASE.md` (verbatim).
3. State in 3–5 lines what the next session should focus on.

Do not write new code or start new tasks during the session-end ritual. This is purely a clean shutdown.

---

*This file is a static template. Do not modify it during normal sessions.*
