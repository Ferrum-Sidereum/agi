# EXECUTION CHECKPOINT — clean slate

- **Lifecycle state:** `ZERO_STATE`
- **Next stage:** `DISCOVER_FIRST_GOAL`
- **Active global checkpoint:** `NONE`
- **Active subgoal:** `NONE`
- **Agent-authored strategic plan:** `NONE`
- **Goal exit criteria:** `NONE`
- **User-directed reset:** `2026-10-21`
- **Last accepted decision:** `ADR-0003` (see DECISIONS.md)
- **Read source branch:** `dev`
- **Only write branch:** `experiment/chatgpt-scheduled-loop`
- **Budget:** `0` incremental expenditure
- **Standing constraints:** no compromise/exposure of the user; no paid or potentially billable actions; no alternate AI executor; never pause or cancel scheduled task on an iteration failure.

## NEXT HOURLY INVOCATION — one independent strategic selection

1. In full, READ `AGENTS.md`, the experiment `.agent/chatgpt-scheduled/README.md`, `GOALS.md`, `PLAN.md`, `GOAL_HISTORY.md`, `DECISIONS.md`, `CHANGELOG.md` and this checkpoint, then `README.md` on `dev` and relevant project sources. Confirm blob SHAs and actual state.
2. Verify `ZERO_STATE` and **NO ACTIVE GLOBAL GOAL**. Past `G-0001` and `probe-2` were **withdrawn**, not completed. Historical pilot commits are NOT dependencies.
3. Independently formulate a strategic question about the most valuable research capability missing today. Discover and critically compare >=3 distinct candidate LARGE global checkpoints. Prioritize technologies and research instruments that compound future research power; explicitly test cost=0 and uncompromising user safety.
4. Select exactly ONE first self-authored checkpoint with NEW unique ID, defined measurable outcome, frozen independent exit criteria and clear acceptance/falsification plan. Write the goal in `GOALS.md`, the ordered tactical plan in `PLAN.md`, and an ACCEPTED ADR explaining the alternatives.
5. Verify each committed file through GitHub read-back, append truthful CHANGELOG and then update THIS `checkpoint.md` LAST to `GOAL_ACTIVE` with verified commit SHA and next subgoal. Start execution of the selected goal on the FOLLOWING hourly run.
6. If any mandatory read, security gate, actual write, SHA or test fails, report only THIS run as BLOCKED. **Do NOT** fabricate a goal or alter the hourly schedule. Next hourly invocation reads actual GitHub state and reconciles any partially successful writes.

## Historical continuity (NOT active)

A previous interactive setup established a GitHub write pilot. One scheduled marker write and a later manual diagnostic were committed; second independent unattended completion was NOT established. The user explicitly discarded that pilot and its predetermined checkpoint. Their commits remain available through Git history; do NOT restore old pilot files, markers, acceptance gates or tasks.

## Record of the reset

Interactive agent updated policy and zero-state documents, recorded `ADR-0003` and appended the historical changelog, then retired `probe.md`. This checkpoint was written LAST. These are configuration read-back checks, NOT runtime tests. No autonomous strategic goal is being chosen during the reset.
