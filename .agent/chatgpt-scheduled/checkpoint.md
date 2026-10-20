# ChatGPT Scheduled Task — persistent checkpoint

- **Project:** `Ferrum-Sidereum/agi`
- **Read baseline:** `dev`
- **Write branch:** `experiment/chatgpt-scheduled-loop`
- **Status:** `probe-pending`
- **Next stage:** `probe-1`
- **Successful unattended scheduled executions:** 0
- **Last verified unattended write commit:** none
- **Last accepted architecture decision:** `ADR-0001`
- **Required read set:** `AGENTS.md`, `README.md@dev`, `.agent/chatgpt-scheduled/README.md`, `.agent/chatgpt-scheduled/DECISIONS.md`, `CHANGELOG.md`, `.agent/chatgpt-scheduled/probe.md`, this checkpoint.

## Why this exists

Native ChatGPT Scheduled Tasks must first demonstrate genuine unattended GitHub read/write and context continuation. The existing `swarm/` gateway stores and routes tasks but does not invoke models.

## Next run — exact order

1. Read **all** mandatory sources above, select the most recent ACCEPTED ADR and restore the latest actual committed state.
2. Identify stage `probe-1`, explain test objective and failure cases; validate branch and write scope.
3. Write genuine run-1 marker only into `probe.md`, verify committed GitHub read-back, record real SHA.
4. **Only after** verification, update this checkpoint to `probe-2`.
5. Report observed test results with no invented PASS.

If already advanced by another genuine scheduled run, honor the actual stage and do not repeat the test.

## Safety conditions

No Codex, Work, external model APIs, browser automation or alternate AI executor. Never write `main`, `dev`, `swarm/`, `userscripts/` or `daemon_core.js`. Never change `AGENTS.md` unattended. On missing tools, approvals, stale SHAs, unverified outcomes, or failed tests, STOP and report.

## After pilot success

Each subsequent invocation must perform:
`sources/rules/last accepted decision → think/compare → evidence/tests → commit → changelog → checkpoint`.
Advance architecture state only on verified facts. This initial checkpoint was authored in the interactive chat; not evidence of scheduled-task success.
