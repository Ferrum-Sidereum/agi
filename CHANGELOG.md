# CHANGELOG — AGI architecture and ChatGPT scheduled experiment

Append-only chronological record (newest entry first). Document **actual committed changes** and what testing was observed. Prospective plans belong in the checkpoint, not in this log.

## 2026-10-20 — Interactive design update — self-directed global goals and no-compromise/no-spend limits

- **Area:** `experiment/chatgpt-scheduled-loop`.
- **Change:** Added `.agent/chatgpt-scheduled/GOALS.md`, `PLAN.md` and `GOAL_HISTORY.md` for the single-active-global-checkpoint lifecycle; defined strategic question generation on verified completion, self-planned subgoals, and append-only milestone evidence. Updated `AGENTS.md`, runbook and plan priority to prefer technology that measurably expands research capability.
- **Decision:** `ADR-0002` — research-capability multipliers are the preferred long-term directions; uncompromising user privacy/security/reputation protection and **zero incremental user spending** are absolute execution vetoes.
- **Cost/security gate:** no purchases, paid APIs, metered cloud/CI, trials with payment methods or unclear tariffs; no credential/PII publication, impersonation, external publicity or potentially compromising user actions.
- **Checks:** Verified updated files via GitHub connector read-back in interactive chat. Architecture/policy consistency reviewed; no software test command was executed: **runtime tests NOT RUN**. Native Scheduled Task success remains **UNVERIFIED**.
- **Next:** Keep `G-0001` active; complete two genuine unattended write/read-back probes, then require the scheduled agent to author its own next subgoal plan and pursue it under the frozen `G-0001` exit criteria.

## 2026-10-20 — Interactive setup — UNATTENDED PILOT NOT YET VERIFIED

- **Area:** `experiment/chatgpt-scheduled-loop` (created from `dev`).
- **Change:** Seeded the native ChatGPT scheduled GitHub feasibility probe; added `.agent/chatgpt-scheduled/README.md`, `checkpoint.md` and `probe.md`. Added mandatory `AGENTS.md`, this changelog, and a decisions ledger for the scheduled cycle.
- **Decision:** `ADR-0001` — keep ChatGPT's native scheduler separate from existing GitHub-backed `swarm/` control plane until an unattended end-to-end test succeeds.
- **Tests / evidence:** Interactive-chat GitHub create/read operations succeeded. **Unattended scheduled read/write and state handoff: NOT RUN as of this entry.** No runtime unit tests performed as part of this documentation-only setup.
- **Constraints:** no writes to `main`, `dev` or protected runtime files; no secret or credential storage; no fabricated asynchronous capability.
- **Next:** Scheduled run 1 writes and independently reads back a marker; scheduled run 2 reads that marker and commits a second marker. Only then advance to architecture work.

---

## Required future entry template

### YYYY-MM-DD HH:MM TZ — <run-id> — <one concrete outcome>

- **Stage / branch:** 
- **Source baseline / last ACCEPTED decision:** 
- **Problem / considered alternatives:** 
- **Changed paths:** 
- **Tests:** `PASS` / `FAIL` / `NOT RUN` with exact command / assertion and observed result.
- **Commits:** actual GitHub commit SHA(s) and/or links; never speculative.
- **Accepted decision (if any):** decision ID and reason.
- **Risks / rollback:** 
- **Next:** 

Older entries MUST NOT be rewritten just to make a result appear successful.
