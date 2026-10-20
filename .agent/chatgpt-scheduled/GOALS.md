# GLOBAL GOALS — single active strategic checkpoint

This is the **source of truth for the active GLOBAL checkpoint**. Do not confuse it with the per-run execution state in `checkpoint.md`.

## North Star / mission (USER-OWNED; IMMUTABLE BY AGENT)

Evolve `agi` toward an auditable, increasingly autonomous multi-agent intelligence / Personal OS engineering system that preserves knowledge across sessions, discovers useful directions, plans its own work, verifies results and improves its architecture **within the user's authorized boundaries**.

The GPT agent MAY independently choose successive GLOBAL checkpoints and their execution plans **within this mission**, but cannot rewrite the mission, security policy, approved branch scope or change the current global checkpoint's acceptance criteria in order to claim success.

## Current active GLOBAL checkpoint

- **ID:** `G-0001`
- **Title:** Establish an evidence-backed, self-directed architecture research loop.
- **Status:** `ACTIVE — EXECUTION GATED BY PILOT`
- **Created:** 2026-10-20 (interactive user instruction bootstrap)
- **One-sentence outcome:** Demonstrate that ordinary ChatGPT can read the repository's rules and previous state, construct its own plan toward ONE large goal, complete a bounded engineering increment with tests and GitHub evidence, and continue from durable state rather than inventing a new top-level direction.
- **Why first:** Before pursuing larger Personal OS architecture goals, the agent needs a verified mechanism for persistent goals and unattended, auditable iterations.

### Frozen exit criteria — ALL required

- [ ] **C1:** TWO separate native Scheduled Task executions have written genuine GitHub commits without user intervention, and run 2 demonstrably retrieved run 1's exact marker. Pilot `probe.md` and verified SHAs provide evidence.
- [ ] **C2:** Rules, goal, self-authored plan, latest ACCEPTED ADR, CHANGELOG and execution checkpoint are read at the start of a scheduled architecture iteration, with the read set and observed state reported.
- [ ] **C3:** The agent authored its OWN measurable subgoals and ordered plan in `PLAN.md` for achieving `G-0001` (not a new unrelated global mission).
- [ ] **C4:** At least ONE agent-selected architectural question arising from that plan has been investigated, with >=2 approaches, falsifiable counterarguments and evidence recorded in a new ADR.
- [ ] **C5:** The complete iteration included specific observed tests/invariants (including GitHub read-back), actual verified commit SHA(s), truthful CHANGELOG entry, and checkpoint update LAST. Unexecuted runtime tests are explicitly `NOT RUN`.
- [ ] **C6:** Final independent audit checks C1–C5 against remote files/commit history, confirms branch/path safety, and records an explicit `G-0001 COMPLETE` verdict and evidence before choosing any successor goal.

**Acceptance criteria are immutable** until the user explicitly authorizes changes in an interactive chat. A run may refine implementation plan, not redefine success.

### Current focus

**ONLY `G-0001` until all C1–C6 pass.** During `probe-1`/`probe-2` the sole legitimate effort is the mandatory feasibility gate, a prerequisite of G-0001. After successful pilot, generate and pursue a self-authored subgoal plan. Ideas for future goals can be parked as notes; no execution or switching to them.

### Exit / successor transaction

When, and ONLY when, all criteria have verifiable evidence:

1. Perform an independent adversarial completion audit; list each criterion with source, commit SHA, PASS/FAIL/NOT RUN.
2. If any criterion is FAIL/NOT RUN or evidence insufficient, remain on `G-0001`; choose a corrective step. **NEVER weaken the criteria**.
3. If all PASS: add an append-only completion record to `GOAL_HISTORY.md`, close `G-0001` in this file, then ask a fresh strategic question: **"Given the mission and verified capabilities, what is the highest-leverage NEXT missing capability, why now, and how could this choice fail?"**
4. Research >=3 distinct candidate next GLOBAL checkpoints, with impact, dependencies, estimated evidence requirements, risks and alternatives. Pick the strongest; justify rejected candidates.
5. Publish exactly ONE new `G-0002` checkpoint with an observable outcome, immutable pass/fail criteria, test strategy, reversibility and explicit reference to the predecessor's evidence. Update `PLAN.md` for the new goal; update CHANGELOG/ADR and per-run checkpoint as usual.
6. If no defensible next goal exists, keep `G-0001` closed and report `AWAITING_STRATEGIC_EVIDENCE`; do not fabricate goals or claim work happened.

**Do not advance multiple global goals in a single run**. Planning and selection of the new goal after completing the old is allowed; implementation of the new goal begins next run.

## Invariants

One active global checkpoint maximum. No `COMPLETE` without verified exit evidence. No global-goal switch because a smaller technical task is finished, a more interesting idea appeared, or a deadline elapsed. If blocked, the goal remains active and unblock work stays within the goal; escalate if safe progress is not possible.
