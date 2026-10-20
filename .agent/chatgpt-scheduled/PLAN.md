# SELF-AUTHORED PLAN — agent-owned execution steps for ONE global checkpoint

- **Global checkpoint:** `G-0001` (see `GOALS.md`)
- **State:** `NOT YET SELF-PLANNED — PILOT GATE`
- **Owner:** future ordinary-ChatGPT scheduled agent
- **Current gate:** two successful unattended GitHub marker runs; see `probe.md`.

## Agent instructions after the pilot passes

The first architecture-stage run must READ: `AGENTS.md`, source README and relevant files, `GOALS.md`, this file, last ACCEPTED ADR in `DECISIONS.md`, latest CHANGELOG and `checkpoint.md`. Only then create a **self-generated**, ordered plan toward `G-0001`, NOT a plan written in advance by the interactive assistant.

Define a finite sequence of agent-proposed measurable subgoals `S-0001`, `S-0002`, etc. Each needs: purpose, dependency, deliverable, test/evidence, status (`TODO`, `IN_PROGRESS`, `VERIFIED`, `BLOCKED`) and a link to one or more frozen `G-0001` acceptance criteria. Prioritize by critical path. Keep exactly one `IN_PROGRESS` subgoal.

Every scheduled iteration must select ONE concrete next action under the currently `IN_PROGRESS` subgoal; compare alternatives where warranted, carry out the allowed research/documentation, validate evidence and commit. A subgoal is `VERIFIED` only after observed checks; when it is completed select the next subgoal under the SAME `G-0001`.

Replanning is permitted as the agent learns: document **why the old plan was insufficient**, preserve completed evidence and remain inside the active global goal. Do not quietly change the global objective, mission or exit criteria. If a new idea is outside `G-0001`, put it in Future candidates without working on it.

## Planning record

### Global checkpoint `G-0001`

**Proposed subgoals:** To be determined autonomously by first successful scheduled architecture run after pilot.

**Last plan revision:** none (intentionally deferred to the agent).

**Current tactical action:** `complete unattended feasibility pilot` (precondition; not a self-authored subgoal).

**Next self-planning question (after pilot only):** What sequence of verifiable, smallest sufficient subgoals will prove all frozen acceptance criteria of G-0001, and which subgoal is on the critical path?

## Future candidates — parked, NOT active

Agent may append new directions as hypotheses with rationale and dependencies, but may not execute them, declare a second ACTIVE global checkpoint, or switch away from `G-0001` before its verified completion.

## Per-iteration tactical log format

- **Run and prior checkpoint SHA:**
- **Active goal / current subgoal:**
- **Chosen action and why it is on the critical path:**
- **Alternatives / counterarguments:**
- **Expected output, test and falsifier:**
- **Actual evidence and commit:**
- **Subgoal status and next action:**
