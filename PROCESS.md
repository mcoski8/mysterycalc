# MysteryCalc — How We Work Together (The Documentation & Session System)

> **Purpose:** This file explains the working process and documentation system we will use to build **MysteryCalc**, modeled on the system proven across the PokeSentry project (and shared by TrendRadar, Taiwanese, TaiwanAPP, etc.). It is written for a non-technical owner. Read this first; it is the "how we work" contract before we talk about "what we build."
>
> Once we agree on this process, the actual project docs (CLAUDE.md, CURRENT_PHASE.md, etc.) get created and this file becomes the reference for *why* they exist.

---

## 1. The Core Idea: Memory That Survives Between Sessions

Claude (me) starts every session with **zero memory** of what we did before. The entire system below exists to solve exactly one problem: **make each new session pick up exactly where the last one left off, with no re-explaining and no re-litigating decisions we already made.**

The way we do that is a small set of markdown (`.md`) files in a `docs/` folder, each with a specific job. Some are read at the *start* of every session; some are written at the *end* of every session. Together they are the project's brain.

There are two layers of memory:

1. **Project docs** (the `docs/` folder, lives in this repo) — everything about *this* project.
2. **Global memory** (lives in `~/.claude/.../memory/`) — facts about *you* and *how you like to work* that apply across ALL your projects (your non-technical background, "push every session," "don't suggest phone testing," etc.). I already carry these automatically.

This document is about layer 1.

---

## 2. The Files and What Each One Does

Here is the full file hierarchy we will create under `docs/`, and the job of each file.

```
mysterycalc/
├── docs/
│   ├── CLAUDE.md              ← THE master context. Read FIRST, every session.
│   ├── CURRENT_PHASE.md       ← "Where are we RIGHT NOW." Rewritten end of every session.
│   ├── DECISIONS_LOG.md       ← Every decision we make, append-only, never edited.
│   ├── checklist.md           ← Every task, checked off as done.
│   ├── session-end-prompt.md  ← The fixed recipe for closing a session cleanly.
│   ├── SPRINT_INDEX.md        ← One-line status of every sprint (the table of contents).
│   ├── sprints/               ← One file per sprint with its task list + session logs.
│   │   ├── s0-foundation.md
│   │   ├── s1-....md
│   │   └── ...
│   ├── handoff/               ← Rolling session journal, split into numbered files.
│   │   ├── MASTER_HANDOFF_01.md
│   │   └── MASTER_HANDOFF_02.md ...
│   ├── modules/               ← Technical reference for each component we build.
│   ├── research/              ← Deep-dive findings (when we research before building).
│   ├── architecture/          ← Big-picture design docs.
│   └── onboarding/            ← How-to guides (setup, install, etc.) when needed.
└── (the actual code lives outside docs/)
```

### The files read at the START of every session

**`CLAUDE.md` — the master context file.**
This is the single most important file. It is read first, every time. It contains:
- **Project summary** — what MysteryCalc is, in plain language.
- **The phases** — the project's long-term roadmap broken into stages, each with an *exit criterion* (the concrete condition that says "this phase is done, move to the next").
- **Hard rules** — the non-negotiables. Things we will never do, no matter what. (In PokeSentry these were things like "never store credit cards," "no queue-bypassing.") MysteryCalc will have its own.
- **Key architectural decisions** — the big "we chose X because Y" calls, summarized (the full reasoning lives in DECISIONS_LOG.md).
- **Tech stack** — what it's built with.
- **Code quality standards** — how code should be commented and named, *specifically tuned to the fact that you are non-technical* (comment the WHY, not the what; flag fragile spots with WARNING/GOTCHA tags).
- **Do's and Don'ts.**
- **Any mandatory collaboration rules** — e.g. PokeSentry's "after a live test, STOP and ask the operator what they saw before diagnosing." We'll add ours as we learn them.
- At the bottom: "**After reading this, read these next, in order**" → points to CURRENT_PHASE.md → the active sprint file.

> CLAUDE.md changes slowly. It's the constitution. It gets *amended*, not rewritten, and amendments are recorded as decisions.

**`CURRENT_PHASE.md` — the "you are here" pin.**
This is the freshest snapshot of the project. It is **completely rewritten at the end of every session** (not appended to). It tells the next session:
- Which sprint/phase is active and its status.
- What got done this session (with file paths).
- What's in progress, what's not started.
- Blockers and gotchas/lessons from this session.
- A numbered list of immediate next actions.
- Which handoff file is currently active.
- **A ready-to-paste "resume prompt"** — a block of text the next session reads to instantly reload full context. This is the single most valuable artifact each session produces. (You may also literally paste it to start the next session.)

### The files written at the END of every session

**`session-end-prompt.md` — the closing recipe.**
A *static template* (we write it once and don't change it). At the end of every session I follow it line by line. It's a checklist that guarantees nothing gets dropped:
1. **Pre-flight checks** — does the code still build / run / import without errors? Are there uncommitted changes?
2. **Update the active sprint file** — task statuses + a session log entry.
3. **Rewrite CURRENT_PHASE.md** entirely.
4. **Append to the active MASTER_HANDOFF file** — session number, summary, files changed, decisions, issues, next steps.
5. **Append any new decisions to DECISIONS_LOG.md.**
6. **Check off completed tasks in checklist.md.**
7. **Update SPRINT_INDEX.md** if a sprint's status changed.
8. **Roll the handoff file** if it's gotten too big (see below).
9. **Commit + push** (your standing rule for most projects).
10. **End by printing the resume prompt** — that's your signal we're cleanly closed.

> Your memory has several feedback rules about this: follow it line by line, don't skip steps, audit it on demand, and **always end with the verbatim resume prompt.** I'll honor those here too.

**`DECISIONS_LOG.md` — append-only decision record.**
Every non-trivial decision, in a fixed format:
```
## Decision NNN — <short title>
Date:
Question:
Options:
Choice:
Why:
```
**Rule: append only, never edit past entries.** If we change our minds later, we write a *new* decision that says "this amends/supersedes Decision NNN," and we say why. This is what stops us from re-debating settled questions session after session. Decisions are referenced everywhere by number (e.g. "per Decision 054").

**`checklist.md` — the master task list.**
Every task across every phase and sprint, as checkboxes. `[x]` done, `[ ]` not. Struck-through items (`~~...~~`) are things we deliberately decided NOT to do, with a note why. It's the at-a-glance "how much is left."

**`SPRINT_INDEX.md` — the sprint table of contents.**
A single table: every sprint, its name, its phase, its status (Not Started / In Progress / Complete), start + end dates. Read this to understand the whole arc of the project quickly.

### The supporting folders

**`sprints/` — one file per sprint.** A "sprint" is a focused chunk of work toward one goal. Each sprint file has: the goal/scope at top, a **task table** (status per task), and a growing **session log** (dated entries: what was done, decisions, gotchas, files touched). This is the detailed working record; the handoff is the narrative summary.

**`handoff/MASTER_HANDOFF_NN.md` — the rolling journal.** Append a narrative entry every session: "Session 12 (date) — did X, learned Y, changed files Z, next is W." When a handoff file passes ~15KB it gets **closed** (with a one-line "covers sessions X–Y" header) and a new numbered file starts. This keeps any single file small enough to read fast. PokeSentry is on file #45 after 123 sessions — that's the scale this system reaches.

**`modules/` — component reference.** When we build a real piece (say, the calculation engine, or the UI, or a data importer), it gets a module doc: what it does, what calls it, what it calls, where it's fragile. So future sessions don't have to re-read all the code to understand a part.

**`research/` — pre-build investigation.** One of your standing rules: *for big architectural changes, research first (web + a second AI opinion via the `pal`/Gemini tools) and write a plan BEFORE implementing.* Those findings land here as dated deliverables.

**`architecture/` — big-picture design.** The high-level "how the whole thing fits together" docs.

**`onboarding/` — how-to guides.** Setup, install, "click here then here" instructions — written for a non-technical user when a manual step is unavoidable.

### Two extra patterns confirmed from PokeHolder

PokeHolder uses the same system as PokeSentry, plus two things worth copying:

**The proposal / sign-off gate (`STACK_PROPOSAL.md`).** Before *any* code is written, PokeHolder wrote a `STACK_PROPOSAL.md` marked **"DRAFT — awaiting user sign-off"** that laid out the full product + technical architecture *with rationale*, section by section, so you could push back on each part before a single line of code existed. Nothing got built until you signed it off. **This is exactly the stage MysteryCalc is about to enter.** Our discussion will produce this proposal doc, and we don't build until you approve it. (It can be called `STACK_PROPOSAL.md`, `PROPOSAL.md`, or similar.)

**Root pointer files for Claude Code's auto-loader.** PokeHolder's *root* `CLAUDE.md` is a one-liner — `@AGENTS.md` — and `AGENTS.md` holds short, always-on agent rules (e.g. "this Next.js is newer than your training — read the bundled docs first"). Claude Code automatically reads the root `CLAUDE.md`/`AGENTS.md` at startup, which then points into `docs/CLAUDE.md`. So there are really two CLAUDE.md files: a tiny root pointer, and the real `docs/CLAUDE.md` master context. We'll set this up so I auto-load the right context every session.

One more refinement PokeHolder's `session-end-prompt.md` adds: **run only the pre-flight checks relevant to what was touched this session** (don't run the data-sync check if you only edited docs). Smarter, faster shutdowns.

---

## 3. The Rhythm of a Session

**At session start, I:**
1. Read `docs/CLAUDE.md` (the constitution).
2. Read `docs/CURRENT_PHASE.md` (where we are + the resume prompt).
3. Read the active sprint file and any module/research docs it points to.
4. (Plus I automatically have your global memory about how you work.)

Then we work.

**At session end, I:**
1. Run the `session-end-prompt.md` recipe line by line.
2. Update all the docs (sprint file, CURRENT_PHASE rewrite, handoff append, decisions, checklist, index).
3. Commit + push.
4. Print the resume prompt.

That loop is the whole system. Done consistently, it means session 50 starts as smoothly as session 2.

---

## 4. Phases, Sprints, Decisions — How They Relate

- **Phases** = the big chapters of the project's life (e.g. PokeSentry's Validation → Productionization → Hardening → Multi-tenant → Launch). Each has an **exit criterion** — a concrete, testable condition to advance. We do NOT skip ahead; we don't write later-phase code while in an earlier phase. This keeps scope honest.
- **Sprints** = the focused work-chunks inside a phase. Numbered (S0, S1, S2…). Each is one sprint file.
- **Decisions** = the individual "we chose X" calls, numbered and logged forever.

A phase contains many sprints; a sprint produces several decisions. CLAUDE.md holds the phases + summarized decisions; SPRINT_INDEX + sprint files hold the sprints; DECISIONS_LOG holds the decisions in full.

---

## 5. The Principles Behind It (Why It Works)

1. **Write for a non-technical owner.** Plain language, explain the why, give click-by-click steps for manual work, prefer automated checks over "go test it yourself."
2. **Append-only history, rewrite-only present.** History (decisions, handoffs, sprint logs) is never edited — only added to. The present (CURRENT_PHASE) is fully rewritten each time so it's never stale.
3. **Never re-litigate.** If it's in DECISIONS_LOG, it's settled unless a new decision supersedes it. This is what makes a 100+ session project possible.
4. **Small files beat big files.** Roll the handoff, keep the index lean — so any file can be read quickly at session start.
5. **The resume prompt is sacred.** Every session ends with it; it's both the next session's loader and your "we're done" signal.
6. **Research before big swings.** Investigate + get a second opinion + write a plan before large architectural changes.
7. **Hard rules are hard.** The non-negotiables in CLAUDE.md survive every phase. We don't quietly relax them.

---

## 6. What's Still Blank (We Decide These Together)

This document describes the *machinery*. The *content* is what we'll fill in during our discussion:

- **What is MysteryCalc?** (The name suggests some kind of calculator — to be defined.)
- **What are its phases and their exit criteria?**
- **What's the tech stack?**
- **What are the hard rules for this project?**
- **What does Sprint 0 (foundation) need to contain?**

When you're ready, let's talk through those.

---

## 7. The Exact Files I Will Create (the build-out manifest)

When we finish our discussion and you give the go-ahead, here is precisely what I'll create, in order. Nothing here gets built until you sign off on the proposal doc (step 1).

**Stage A — Discussion → Proposal (the sign-off gate):**
1. `docs/PROPOSAL.md` (a.k.a. STACK_PROPOSAL) — the full product + technical architecture with rationale, marked **DRAFT — awaiting your sign-off**. We iterate on this together. *No code until you approve it.*

**Stage B — Once you approve the proposal, the doc skeleton:**
2. `CLAUDE.md` (root) — tiny pointer (`@AGENTS.md`) so Claude Code auto-loads context.
3. `AGENTS.md` (root) — short always-on agent rules.
4. `docs/CLAUDE.md` — the real master context (project summary, phases + exit criteria, hard rules, tech stack, code/comment standards for a non-technical owner, do's & don'ts, repo layout).
5. `docs/CURRENT_PHASE.md` — initial "you are here" + first resume prompt.
6. `docs/DECISIONS_LOG.md` — seeded with the decisions we make during the discussion (Decision 001, 002, …).
7. `docs/checklist.md` — every task by phase/sprint.
8. `docs/session-end-prompt.md` — the static clean-shutdown ritual (run-only-relevant-checks version).
9. `docs/sprints/SPRINT_INDEX.md` — the sprint status table.
10. `docs/sprints/s0-foundation.md` — Sprint 0 detail.
11. `docs/handoff/MASTER_HANDOFF_01.md` — the empty rolling journal, ready for session 1.
12. `README.md` — minimal repo readme.
13. `.gitignore` — and `git init` if we want version control from day one.

**Created later, as needed (not upfront):**
- `docs/sprints/sN-*.md` — a new file per sprint as we start each one.
- `docs/modules/*.md` — a doc per real component once we build it.
- `docs/research/*.md` — when we research before a big swing.
- `docs/architecture/*.md` and `docs/onboarding/*.md` — if/when warranted.
- New `MASTER_HANDOFF_NN.md` files — when the current one passes ~15KB.

---

*This file is the process reference. It is based on the documentation systems observed in two of the owner's projects — PokeSentry (`/Users/michaelchang/CODE/pokesentry/docs/`) and PokeHolder (`/Users/michaelchang/CODE/pokeholder/docs/`) — as of 2026-06-05.*
