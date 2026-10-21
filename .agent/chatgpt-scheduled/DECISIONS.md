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

## ADR-0002 — ACCEPTED — Single global goal, research-capability priority, user safety and zero incremental spend

- **Date:** 2026-10-20
- **Authority:** Direct user instructions in the interactive chat; these are mission-level design constraints, not an agent-generated hypothesis.
- **Context:** The agent should develop its own long-horizon goals, but must not switch randomly between directions. Its highest-priority strategic benefit is improving its capacity for further research, while protecting the user completely and never incurring monetary costs.
- **Decision:** Maintain exactly ONE active global checkpoint in `GOALS.md`. The scheduled agent independently authors the ordered subgoals and actions in `PLAN.md`, works only toward the active checkpoint, runs tests and verifies commits. Its frozen criteria cannot be weakened for easy closure. After independent confirmation of completion, the agent itself asks the next strategic question, evaluates >=3 candidate successor checkpoints, and picks ONE demonstrably valuable next goal. Rank candidate tools and technologies by measurable increase in research capability (discovery, retrieval, provenance, hypothesis testing, experimentation, verification, memory and observability), reuse and zero-cost feasibility. User compromise, private-data exposure, impersonation, reputation/security/legal risks, or uncertain/additional financial cost are ABSOLUTE vetoes. Public GitHub storage requires privacy screening.
- **Alternatives considered:** (a) Arbitrary open-ended exploration — rejected: no sustained progress; (b) entirely user-defined tactical backlog — rejected: prevents self-directed planning; (c) optimization only for feature count or novelty — rejected: poor compound research leverage; (d) paid tools or risky shortcuts — forbidden by user instructions.
- **Evidence:** User-defined design constraints recorded in `AGENTS.md`, `GOALS.md`, `PLAN.md` and runbook. **Unattended enforcement remains untested pending the scheduled pilot.**
- **Risk / failure mode:** Self-reported completion, goal drift, quota-to-billing ambiguity, privacy leakage via logs/public commits. Mitigation: frozen exit criteria; read-only provenance checks; explicit cost=0 and user-risk veto before every action; append-only milestone history.
- **Reversal condition:** Only an explicit interactive instruction from the user can amend the mission, hard spending/security limits or frozen exit criteria. The agent cannot grant itself an exception.

## ADR-0003 — ACCEPTED — User-directed zero-state reset and independent goal discovery

- **Date:** 2026-10-21
- **Authority:** Explicit user instruction to remove the pilot and reset the research agent to zero state, allowing the next scheduled run to independently choose its own first BIG global checkpoint from the user's priorities.
- **Decision:** Retire the old `probe-1` / `probe-2` acceptance gate and **WITHDRAW, NOT COMPLETE**, the assistant-imposed global goal `G-0001`. New `GOALS.md` and `PLAN.md` begin with NO active goal or tactical tasks. The next hourly scheduled invocation MUST inspect real sources and the charter, formulate >=3 research-capability multiplier directions, challenge alternatives, and independently select ONE verifiable global goal and its own plan. Implementation begins on the following run. Research capability gains take priority, with absolute zero-cost and user-protection vetoes. Persist results via actual verified GitHub commits and checkpoint LAST; never self-disable the hourly task on error.
- **Supersedes:** `ADR-0001` (mandatory two-run GitHub feasibility pilot) and any fixed G-0001/probe-stage obligations in old runbooks. `ADR-0002` continues to govern single-active-goal discipline, measurable research leverage, security, privacy and budget 0.
- **Prior evidence:** The earlier unattended marker and manual diagnostic are real historical commits, not proof that the abandoned pilot was completed or evidence for a new self-selected goal. They remain in Git history and are not to be reactivated.
- **Alternatives rejected:** Extend blocked pilot indefinitely; have an interactive assistant choose the next goal now; silently declare pilot passed. All conflict with user's stated preference for zero state and autonomous strategic choice.
- **Validation:** Inspect current `GOALS.md` (`ZERO_STATE`, active NONE), `PLAN.md` (no active subgoal), `checkpoint.md` (`DISCOVER_FIRST_GOAL`), and scheduled instruction (no references to probe gates); verify relevant GitHub read-backs. Execution of a future goal remains unverified.
- **Risk:** Failure of next Scheduled Task's GitHub write must leave zero state intact and hourly recurrence enabled; no alternative payment/API or unauthorized runtime.
- **Reversal:** Only explicit future user instruction may restore or revise these priorities and safety limits.

## Recording a future decision

Use `ADR-0002`, `ADR-0003`, ... with exactly one status (`PROPOSED`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`), context, alternatives, evidence, failure modes, test references, implications and reversal criteria.

Before changing an accepted ADR, add a **new** ADR with explicit `supersedes: ADR-XXXX`; never silently rewrite history.
