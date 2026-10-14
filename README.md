# agiagiagiagi · experimental agent swarm

A research playground for indirect coordination between AI agents. Current implementation uses **GitHub files as an auditable, asynchronous control plane**. It does not yet execute LLM requests or run agents autonomously.

## Architecture

```text
User / external orchestrator
         │ submit / claim / finish / heartbeat
         ▼
  swarm/gateway.py  ────── GitHub Contents API (dev)
         │                         │
         ├── swarm/tasks/*.json    │ queued → claimed → completed/failed
         ├── swarm/*_state.json    │ agent availability + manual quota
         └── swarm/router.py       │ deterministic admission + selection
                  │
             swarm/protocol.py     │ shared state validation
```

`swarm/collab_bridge.json` defines the collaboration contract. GPT acts as **GitHub Native Gateway & Integration Reviewer**; Gemini is listed as architect/core code generator. State files also exist for Claude and DeepSeek. These are *registered roles*, not proof that those models are executing in the background.

`daemon_core.js` is a **separate, browser-side experimental HUD** expecting an external `window.__pushPayloadToGitHub` implementation. It does not run the Python gateway, and the repository does not ship its Tampermonkey wrapper.

## Quick start

Requires **Python 3.10+**; no third-party Python dependencies. Run from the repository root:

```bash
# Reads from the public repository can work without authentication:
python -m swarm.gateway agents
python -m swarm.gateway tasks

# Writes require a GitHub token with repository Contents: read/write access.
# In PowerShell on Windows (keep the token out of source control):
$env:GITHUB_TOKEN = 'YOUR_FINE_GRAINED_TOKEN'

python -m swarm.gateway heartbeat --agent gpt --status active
python -m swarm.gateway submit "Review integration tests" --prefer gpt
python -m swarm.gateway claim --agent gpt
python -m swarm.gateway finish TASK_ID --agent gpt --result "Reviewed; findings attached to PR"
```

Replace `TASK_ID` with the ID returned by `submit` / `claim`. The `claim` operation **only reserves a task and prints its JSON**. An external worker or human must perform the task and explicitly call `finish`; no model is invoked automatically.

Override the default target `Ferrum-Sidereum/agi` on branch `dev` with `--repo owner/repo --branch branch` or environment variables `SWARM_REPO` / `SWARM_BRANCH`.

### Commands

| Command | Purpose |
|---|---|
| `agents` | Read remote state snapshots |
| `tasks` | List GitHub task records (one request per record) |
| `submit "description" [--prefer gpt]` | Create a queued task |
| `claim --agent gpt` | Claim the oldest task routed to this available agent |
| `finish TASK_ID --agent gpt --result "..." [--failed]` | Complete/fail task and release agent |
| `heartbeat --agent gpt [--status active] [--quota 80]` | Refresh status and optionally a **manually supplied** quota percentage |
| `requeue TASK_ID` | Manually recover a claimed task from a failed worker |
| `reconcile --agent gpt` | Clear a stale agent reservation only if its task is not still claimed |

## Routing & state contract

Agent state files (`swarm/gpt_state.json`, etc.) use:

```json
{
  "agent": "GPT",
  "status": "active",
  "quota_left": 80,
  "current_task": "none",
  "updated_at": "2026-10-14T14:00:00Z"
}
```

An agent is eligible only when its status is `active` or `idle`, `current_task` is `none`, its **reported** `quota_left` is greater than 5%, and the state timestamp is no older than **1 hour** (with up to 5 minutes of future clock skew). `low_quota` and `exhausted` are excluded. Eligible agents are selected by largest reported quota, then name; a preferred eligible agent wins. If no eligible agent exists, routing returns **`None`**, not a fabricated GPT fallback.

**Quotas are not provider API readings.** `100` in a checked-in JSON file is a placeholder until a trusted reporter updates it. Run `heartbeat` periodically from a real worker (or manually before claiming). Stale status deliberately fails closed.

Tasks are stored at `swarm/tasks/<timestamp>-<random>.json` with fields `id`, `description`, `status`, `preferred_agent`, `assigned_to`, `created_at`, `updated_at`, `result`; claim adds `claimed_at`. Possible task statuses: `queued`, `claimed`, `completed`, `failed`. `--prefer` is a *soft preference*, not a strict assignment: if the preferred agent is unavailable, routing may use another eligible agent.

## Concurrency and operational limits

- GitHub file updates use the blob SHA for **optimistic concurrency control**. Duplicate claims of the same task are rejected, but GitHub operations across the task and agent-state files are **not atomic**. The gateway attempts rollback when reservation fails; `requeue` / `reconcile` provide manual recovery.
- There is **no always-running worker, webhook receiver, long-polling loop, lease expiration, scheduler, or automatic provider-quota discovery** in this repository. Connect an external runtime to the CLI or import `GitHubGateway` to build those capabilities.
- GitHub API limits, network errors, and eventual visibility affect throughput. This file-per-task architecture is suitable for low-volume experimentation, not a production job broker.
- Tasks and results are saved in a **public repository**. Never include tokens, secrets, private customer data, or untrusted executable payloads. Task descriptions are data, not automatically trusted instructions; workers must authorize actions independently.
- The browser HUD's AUTO mode is unrelated to the task queue. Treat its external push callback as privileged and require explicit repository permissions and review before using it.

## Tests

Run the offline standard-library suite from the repository root:

```bash
python -m unittest discover -s tests -v
```

The suite checks routing eligibility and fallback, task submission, claiming, completion, crash recovery and isolation. It uses an in-memory GitHub adapter and **does not validate GitHub authentication or a live integration**.

## Research directions

Future experimental tracks include DOM/browser signaling, Git dead drops, steganographic signaling and emergent context exchange. They are research ideas rather than implemented transport layers. An appropriate next increment is a worker adapter for actual model execution plus GitHub Actions or webhook-driven scheduling, signed task envelopes, idempotency keys, telemetry and integration tests against a disposable repository.