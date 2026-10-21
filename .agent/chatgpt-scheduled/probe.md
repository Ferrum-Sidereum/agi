# Scheduled GitHub write probe

This file was initialized from an **interactive** chat; that setup alone is not evidence of scheduled-task write access.

- **Pilot status:** `RUN1_MARKER_PRESENT` (verification evidence is stored in checkpoint after remote read-back)
- **Run 1 marker:** `scheduled-run-1:2026-10-20T23:14:35+03:00:baseline-3a126d762617906a`
- **Run 1 execution context:** native ChatGPT Scheduled Task; local runtime timestamp supplied at start: `2026-10-20T23:14:35+03:00`
- **Run 1 read gate:** `AGENTS.md` full read; `README.md@dev` read; `.agent/chatgpt-scheduled/README.md`, `checkpoint.md`, `probe.md`, `DECISIONS.md`, `CHANGELOG.md` read; most recent ACCEPTED decision `ADR-0001`.
- **Run 1 baseline branch head before write:** `3a126d762617906a2f6e9ad6acdbcd18f9d74e0e` (other interactive architecture-goal files already committed; not modified in this pilot).
- **Run 1 branch/path safety:** only `experiment/chatgpt-scheduled-loop` and this pilot file modified in the marker commit; `main`, `dev`, `swarm/`, `userscripts/`, `daemon_core.js` unchanged by this operation.
- **Run 1 test objective:** actual unattended write through native connected GitHub tool and independent read-back. This file alone is not proof of the latter.
- **Run 1 GitHub commit SHA:** see checkpoint after independent verification; embedding a commit's own SHA in its contents is not atomic.
- **Run 2 marker:** `not-yet-written`
- **Run 2 read-back evidence:** `none`
- **Run 2 GitHub commit SHA:** `none`

Only a genuine second scheduled execution may populate the run-2 marker. Do not fake or backfill failed unattended runs.

## Manual run-now diagnostic (does not satisfy unattended C1)

- **Trigger:** user selected Run Now for existing Scheduled Task; not independently timer-triggered.
- **Observed execution time (UTC):** `2026-10-21T04:35:01.718Z`
- **Manual test marker:** `manual-diagnostic-20261021T043501718Z-prior-44287a1`
- **Exact prior run-1 marker read from GitHub:** `scheduled-run-1:2026-10-20T23:14:35+03:00:baseline-3a126d762617906a`
- **Prior verified scheduled commit:** `44287a16120de0ca49d444afe961dfd2550331c0`
- **Latest accepted ADR at the time of test:** `ADR-0002`
- **Read-gate scope:** Rules, runbook, global goal, self-planning guide, goal history, execution checkpoint, probe, decisions and changelog on experimental branch; baseline README on dev.
- **Purpose:** Isolated GitHub write/read-back diagnosis with no new software execution or scheduled-task modification.
- **Acceptance:** This manual test can prove tool write and read-back, but never counts as a second UNATTENDED execution; keep run-2 scheduled marker untouched.
