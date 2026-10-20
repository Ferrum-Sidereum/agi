# Native ChatGPT Scheduled Loop — runbook and feasibility gate

## Mission

Test whether **ordinary ChatGPT Scheduled Tasks** can read and write GitHub WITHOUT a user approving each write, and preserve accurate project state between scheduled invocations. Codex, Work, external model APIs, GitHub Actions as an AI executor and browser automation are OUT OF SCOPE.

- Repository: `Ferrum-Sidereum/agi`
- Baseline/source branch: `dev`
- Only writable branch: `experiment/chatgpt-scheduled-loop`
- Current research status: **not yet verified by unattended runs**.

The existing `swarm/` gateway is a control plane, not an autonomous model executor. Do not modify it in this experiment.

## Mandatory read gate — EVERY scheduled run, before analysis or writes

1. Read `AGENTS.md` on experiment branch in full (hard rules and stop conditions).
2. Read `README.md` on `dev`, then the relevant source files for the chosen issue.
3. Read this runbook and `.agent/chatgpt-scheduled/checkpoint.md`.
4. Read `.agent/chatgpt-scheduled/DECISIONS.md`; identify and cite the latest **ACCEPTED** ADR (currently ADR-0001).
5. Read the latest `CHANGELOG.md` entries and `.agent/chatgpt-scheduled/probe.md`; cross-check whether a stage was already committed.
6. Confirm working branch, current blob SHAs, and allowed write paths before any edit.

If anything mandatory is missing, stop; do not make up context.

## Required engineering cycle for EACH scheduled execution

**READ INPUTS → RESTORE STATE → CHOOSE NEXT PROBLEM → THINK/CHALLENGE → VERIFY/TEST → COMMIT → VERIFY REMOTE → CHANGELOG → CHECKPOINT → REPORT.**

- `READ INPUTS`: current rules, original project sources, checkpoint, last ACCEPTED ADR, recent changelog.
- `RESTORE STATE`: verify stage from committed GitHub content; don't trust only the task prompt or prior chat.
- `CHOOSE NEXT PROBLEM`: one concrete question and acceptance criteria (pilot: feasibility test).
- `THINK/CHALLENGE`: compare options and counterarguments; record failure modes and falsifiable assumptions.
- `VERIFY/TEST`: run *available* concrete tests/invariants and capture the observations. `NOT RUN` is never `PASS`.
- `COMMIT`: only permitted changes, correct branch, compare-and-swap SHA where available; no merge/force.
- `VERIFY REMOTE`: retrieve committed content again and confirm actual commit result/branch.
- `CHANGELOG`: for post-pilot architecture cycles, append truthful results, evidence and change references.
- `CHECKPOINT`: advance only after preceding write(s) verified. Checkpoint is always the final write.
- `REPORT`: describe actual results and blockers, not intentions.

## Pilot stages (first two unattended runs)

**Stage 1 / `probe-1`:** perform mandatory reads, evaluate the risk/benefit of the proposed test (no modification of protected runtime). Confirm branch and existing marker fields. Update **only** `.agent/chatgpt-scheduled/probe.md` with the genuine run-1 marker including run time, last ACCEPTED ADR ID, and a summary of the rulebook validation. Commit via native GitHub write connector; independently read file back. If verified, update **only** `checkpoint.md` to `probe-2` with actual commit SHA(s). If write/approval fails, stop and explicitly report.

**Stage 2 / `probe-2`:** repeat mandatory reads, retrieve and quote exact run-1 marker from GitHub; verify it is different from the current execution and from interactive setup. Commit second unique marker and the exact previous marker read-back to `probe.md`; independently retrieve it. If verified, update `checkpoint.md` to `architecture-cycle` with actual evidence. Do NOT claim a completed pilot if any part is missing.

**Architecture stage / `architecture-cycle`:** one high-value architecture problem per invocation. Read repo, decisions and changelog first; compare at least two options, stress-test with specific assertions and any runnable tests that exist, document accepted/rejected options (new ADR), commit documentation or safe non-invasive tests **only** to experiment branch. Update `CHANGELOG.md` with actual evidence and then `checkpoint.md` last. Never claim implementation succeeded without executed test evidence. Never change `AGENTS.md` unattended.

## Pass / fail definition

`PASS`: two separate scheduled executions with genuine GitHub writes and verified read-back; second run reads first run's persisted marker. No mid-run user approvals and no prohibited paths touched.

`BLOCKED`: scheduled tool missing, approval required, wrong branch, stale SHA, unreadable files or failed write. State the blocker; do not bypass via another model/runtime.

An interactive GPT commit is NOT proof of scheduled capability. Each file write can be a separate commit; there is no implied cross-file transaction. On restart, first inspect actual repository state and reconcile only verified work.

## Code testing policy

Current pilot and architecture design commits are documentation-only unless tests are explicitly authorized. Existing project commands for future code work: `python -m unittest discover -s tests -v` and `node --test tests/test_browser_gateway.cjs` when relevant. **Do not claim these commands passed unless they were run and their output was inspected.**

The schedule is an hourly sequence of independent GPT invocations, not one uninterrupted model execution.
