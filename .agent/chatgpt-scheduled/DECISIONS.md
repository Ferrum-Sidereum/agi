# Architecture Decision Ledger — Scheduled GPT experiment

Append-only evidence-oriented architecture decisions. The newest date is not necessarily an accepted decision. The next run MUST search for the **highest-numbered ACCEPTED decision** and use it as the baseline. A proposal is never silently promoted to accepted.

## ADR-0001 — ACCEPTED — Isolate scheduled-GPT feasibility from existing swarm

- **Date:** 2026-10-20
- **Context:** `agi` currently includes a GitHub-backed swarm control plane, but the gateway does not invoke LLMs. Ordinary ChatGPT supports scheduled executions and an interactive GitHub connector, but its ability to commit unattended must be established empirically.
- **Decision:** Keep all experimental changes on `experiment/chatgpt-scheduled-loop`; verify TWO independent scheduled reads/writes with commit evidence before using a scheduled task for iterative architecture design. Persist state through tracked files rather than assuming chat-to-chat hidden context.
- **Alternatives:** (a) Modify `swarm/gateway.py` directly — rejected during the pilot because it does not solve the scheduled GPT execution question; (b) Codex/API/Work — out of scope by explicit user constraint; (c) Run a single interactive chat continuously — infeasible for unattended scheduling.
- **Test / evidence at acceptance:** GitHub repo and interactive write access verified; actual unattended scheduling capability UNVERIFIED.
- **Risk:** a Scheduled Task may not have the same GitHub write approval flow as interactive chat. Multi-file GitHub writes may create separate commits.
- **Reversal condition:** if native unattended writes consistently fail or require approval, stop the native-GPT-only loop and report the limitation rather than silently swapping to another provider/runtime.

## Recording a future decision

Use `ADR-0002`, `ADR-0003`, ... with exactly one status (`PROPOSED`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`), context, alternatives, evidence, failure modes, test references, implications and reversal criteria.

Before changing an accepted ADR, add a **new** ADR with explicit `supersedes: ADR-XXXX`; never silently rewrite history.
