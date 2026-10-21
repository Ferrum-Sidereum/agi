# SELF-AUTHORED PLAN — no active plan

- **State:** `ZERO_STATE`
- **Active global goal:** NONE
- **Active subgoal:** NONE
- **Pending action:** autonomous selection and planning of the FIRST global checkpoint on the next scheduled run
- **Previous pilot plan:** RETIRED by explicit user instruction; not a prerequisite

The assistant executing this reset MUST NOT seed a candidate technical goal, first subgoal or ordered implementation plan. All of that belongs to the next independent scheduled GPT execution.

## Planning requirements once the goal is chosen

After reading all mandatory source files, generate ordered, measurable subgoals that together satisfy all of the ONE current global checkpoint's frozen exit criteria. For each: expected impact on research capability, dependencies, output, falsifier/test, cost=0, user-compromise screening, status (TODO / IN_PROGRESS / VERIFIED / BLOCKED).

Keep exactly ONE IN_PROGRESS subgoal. Each hour execute a concrete next action, run directly available verification, save accepted decisions and commits, and update execution checkpoint LAST.

Subgoals may be revised based on tested findings without changing the underlying global checkpoint or inventing completion. New strategic candidates remain parked until current global completion is proven.
