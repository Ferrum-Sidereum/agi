# ChatGPT Scheduled Task — persistent checkpoint

- **Project:** `Ferrum-Sidereum/agi`
- **Read baseline:** `dev`
- **Write branch:** `experiment/chatgpt-scheduled-loop`
- **Status:** `probe-in-progress`
- **Next stage:** `probe-2`
- **Successful unattended scheduled executions:** 1
- **Last verified unattended write commit:** `44287a16120de0ca49d444afe961dfd2550331c0`
- **Last accepted architecture decision:** `ADR-0001`
- **Required read set:** `AGENTS.md`, `README.md@dev`, `.agent/chatgpt-scheduled/README.md`, `.agent/chatgpt-scheduled/DECISIONS.md`, `CHANGELOG.md`, `.agent/chatgpt-scheduled/probe.md`, this checkpoint.

## Verified scheduled run 1

- **Scheduled execution context:** 2026-10-20T23:14:35+03:00 (runtime-supplied local start timestamp).
- **Run 1 marker:** `scheduled-run-1:2026-10-20T23:14:35+03:00:baseline-3a126d762617906a`.
- **GitHub marker commit:** `44287a16120de0ca49d444afe961dfd2550331c0`.
- **Read-back evidence:** GitHub `fetch_file` of `.agent/chatgpt-scheduled/probe.md` returned exact marker, `ADR-0001`, run-2 field `not-yet-written`, and blob SHA `5dd78964a66239d83b7a2afb96db732451a97554`.
- **Commit inspection:** GitHub commit API reported exactly one changed file, `.agent/chatgpt-scheduled/probe.md`.
- **Tests:** GitHub write `PASS`, independent read-back `PASS`, changed-path invariant `PASS`. Local Python/Node runtime tests `NOT RUN` (no code modified).
- **Unverified:** Whether a *different later scheduled invocation* can read this committed marker and write its own marker. Do NOT treat this as a complete two-run pilot.

## Next run — probe-2

1. Read ALL mandatory sources, starting with `AGENTS.md` and `README.md@dev`; identify latest ACCEPTED ADR; verify current branch and SHA state.
2. Read `.agent/chatgpt-scheduled/probe.md` from GitHub and quote the EXACT saved run-1 marker above. If missing, conflicting, or unverified, STOP.
3. Compare read-back with run-1 marker and confirm this is a separate later Scheduled Task execution.
4. Update ONLY `probe.md` with a genuine run-2 marker and evidence of the prior marker, commit to experiment branch, then independently read back the file and inspect the commit path.
5. If verified, update this checkpoint LAST to `architecture-cycle`, with actual run-2 SHA and proof of the two separate runs. If blocked, STOP and report; do not invent success.

## Safety conditions

No Codex, Work, external model APIs, browser automation or alternate AI executor. Never write `main`, `dev`, `swarm/`, `userscripts/` or `daemon_core.js`. Never change `AGENTS.md` unattended. On missing tools, approvals, stale SHAs, unverified outcomes, or failed tests, STOP and report.

## After pilot success

Each subsequent invocation must perform:
`sources/rules/last accepted decision → think/compare → evidence/tests → commit → changelog → checkpoint`.
Advance architecture state only on verified facts.
