# ChatGPT Scheduled Task — persistent checkpoint

- **Project:** `Ferrum-Sidereum/agi`
- **Read baseline:** `dev`
- **Write branch:** `experiment/chatgpt-scheduled-loop`
- **Status:** `probe-pending`
- **Next stage:** `probe-1`
- **Successful unattended commits:** 0
- **Last verified commit:** none

## Known state

The repo contains an experimental control plane (`swarm/`) that does not itself invoke models. We are testing whether native ChatGPT Scheduled Tasks can resume work and commit via its connected GitHub integration.

## Next scheduled run

Read `README.md` in `dev`, and `.agent/chatgpt-scheduled/checkpoint.md`, `probe.md`, `README.md` on `experiment/chatgpt-scheduled-loop`. Follow the stage procedure in the scheduled task instruction. Never infer success from the file's existence.

## Guardrails

- No Codex, Work, API, browser scripts, GitHub Actions or other AI executors.
- Only update `.agent/chatgpt-scheduled/checkpoint.md` and `.agent/chatgpt-scheduled/probe.md` on the experimental branch.
- Do not modify `dev`, `main`, existing swarm tasks, daemon or userscripts.
- If write access is not usable in a scheduled task, report the blocker and stop.

## Research question

Do scheduled noninteractive GPT invocations have GitHub read/write permissions, and can a later invocation recover an earlier invocation's persisted commit?
