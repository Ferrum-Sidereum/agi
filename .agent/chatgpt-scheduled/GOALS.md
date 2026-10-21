# GLOBAL GOALS — active checkpoint registry

**State: ZERO_STATE**

- **Active global checkpoint:** NONE
- **Active checkpoint ID:** NONE
- **Frozen exit criteria:** NONE
- **Global progress:** 0 active; 0 completed in the new self-directed cycle
- **Next transition:** agent-led GOAL_SELECTION during the NEXT scheduled invocation

## Mission and decision priorities (not a checkpoint)

Discover and develop capabilities that make autonomous research substantially more powerful, rigorous, reusable and self-improving. Prefer safe, **zero-additional-cost** technologies and tools that multiply the range, depth and verifiability of future investigations. This mission is intentionally broad: the agent MUST independently discover which FIRST big goal has the highest expected research value.

Hard vetoes: never compromise the user; never incur additional monetary costs; no unauthorized third-party actions or public sensitive data. Operate only within `AGENTS.md` and the experimental branch.

## First autonomous strategic question — NOT answered here

"What major missing capability would most increase my ability to conduct better research in subsequent iterations? What evidence establishes this, what at least three distinct possibilities compete, what are their falsifiable benefits and risks, and which ONE should become my initial global checkpoint?"

The next scheduled run must inspect the real `dev` source baseline and existing research methods, compare >=3 distinct candidate global checkpoints, score gain/reuse/testability/safety/cost and independently choose ONE. Assign a new unique ID not reused from the retired pilot goal `G-0001`; record measurable deliverables, observable and immutable completion criteria, test strategy, dependency risks, alternatives and a definition of DONE.

On successful verified commit, state becomes `GOAL_ACTIVE` and `PLAN.md` holds the independently authored subgoal path. Execution of the first implementation subgoal starts on the following scheduled run.

## Completion contract

A selected global goal remains the ONLY active goal until all frozen criteria are verified and independently audited. Do not switch because another technology seems more interesting. Once complete, archive evidence in `GOAL_HISTORY.md`, ask the next strategic question, and repeat.

## Explicit historical reset

The previously imposed `G-0001` "prove Scheduled Tasks GitHub pilot" was **WITHDRAWN by the user, NOT COMPLETED**. The old `probe-2` test is not a prerequisite. Past evidence remains available in Git history and CHANGELOG for honest accounting but MUST NOT be restored as an active objective.
