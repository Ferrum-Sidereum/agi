# Autonomous Research Loop — operational runbook

Target: `Ferrum-Sidereum/agi`. Read sources from `dev`; write ONLY `experiment/chatgpt-scheduled-loop`. Execution mechanism: native ordinary ChatGPT Scheduled Task plus connected GitHub app. No external agent runtime, Codex, Work, paid/API workers, or GitHub Actions executor.

**The pilot is OVER and NOT a condition of beginning research.** Historical diagnostic records are non-binding. The present system has ZERO active global goals; its next scheduled invocation must independently discover the first goal.

## Mandatory read gate — at every scheduled invocation

1. `AGENTS.md` fully: safety, research priority, budget 0, write scope, no self-disable.
2. `README.md@dev` and relevant code/docs: ACTUAL project baseline.
3. `.agent/chatgpt-scheduled/GOALS.md`, `PLAN.md`, `GOAL_HISTORY.md`, `checkpoint.md`, this README.
4. `.agent/chatgpt-scheduled/DECISIONS.md`: latest ACCEPTED decision; `CHANGELOG.md`: recent actual changes. Verify branch and GitHub blob SHAs.
5. Old `probe.md`, `G-0001`, and `probe-2` are HISTORICAL only: never read them as mandatory execution instructions or restore them as active.

## ZERO_STATE — choose goal on the NEXT run

- Independently ask what high-leverage research capability should be pursued next. Assess baseline; identify missing tools/technologies that multiply future research.
- Formulate >=3 meaningfully distinct candidate BIG global checkpoints. Compare measurable research gains, reuse, feasibility, tests, counterarguments, dependencies, potential user compromise and incremental cost 0.
- Select ONE evidence-backed global checkpoint yourself. Define unique ID, clear outcome, immutable pass/fail exit criteria, required tools, verification and rollback strategy. Do not adopt withdrawn pilot G-0001.
- Independently create ordered, measurable tactical subgoals under the chosen global goal in `PLAN.md`; do not simply echo an earlier assistant-authored task list.
- Commit GOALS, PLAN, architecture decision and CHANGELOG if appropriate, independently verify read-back and update `checkpoint.md` LAST to GOAL_ACTIVE. Next hourly run starts the first tactical action. If any critical write fails, leave ZERO_STATE / accurately report partial commits without claiming selection persisted.

## GOAL_ACTIVE — every further run

Read rules/sources -> restore current goal and last accepted decision -> pick ONE critical-path action from plan -> compare approaches and challenge assumptions -> execute permitted research or implementation -> run actual relevant tests and falsifiers (NOT RUN != PASS) -> commit to experimental branch -> independently verify -> append truthful CHANGELOG and ADR as needed -> checkpoint LAST -> report.

Prioritize technologies that multiply the ability to research in future cycles, not output volume. Never abandon the one current global checkpoint until an independent audit confirms every frozen criterion.

## GOAL_COMPLETE — after verified audit

Append verified closure to GOAL_HISTORY. Next run returns to autonomous strategic question with >=3 candidates and picks ONE successor. Never overlap implementation of two global goals.

## On failure

Safety block, denied write, missing tool, test FAIL, potential expense, uncertain privacy, stale SHA: **STOP only the current action and report BLOCKED; NEVER pause/delete/disable/reschedule the hourly automation.** Retry on later runs only when safe; no tool-switch or bypassing a safety rejection. Don't claim successful tests or commits without actual evidence.

Historic GitHub pilot markers are available through older Git commits if retrospective research is useful. They do NOT count as active work or prerequisites.
