"""GitHub Contents API transport for small, auditable swarm task queues.

This is a CLI/control plane, NOT an always-on LLM worker. All mutations require
GITHUB_TOKEN with Contents write access. Task data must be treated as untrusted.
"""

from __future__ import annotations

import argparse
import base64
import binascii
import json
import os
import re
import sys
import uuid
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from swarm.protocol import STATUSES, eligible, utc_now, utc_stamp
from swarm.router import route_task

REPO_PATTERN = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
AGENT_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")
TASK_PATTERN = re.compile(r"^\d{8}T\d{12}Z-[a-f0-9]{12}$")
TASK_DIR = "swarm/tasks"


class GatewayError(RuntimeError):
    pass


class NotFound(GatewayError):
    pass


class Conflict(GatewayError):
    pass


class GitHubGateway:
    def __init__(self, repo: str = "Ferrum-Sidereum/agi", branch: str = "dev",
                 token: str | None = None):
        if not REPO_PATTERN.fullmatch(repo) or not branch or any(c in branch for c in "?&#"):
            raise ValueError("invalid repository or branch")
        self.repo = repo
        self.branch = branch
        self.token = token if token is not None else os.environ.get("GITHUB_TOKEN", "")

    def _request(self, method: str, path: str, payload: dict | None = None):
        url = f"https://api.github.com/repos/{self.repo}/contents/{quote(path, safe='/')}"
        if method == "GET":
            url += "?" + urlencode({"ref": self.branch})
        if method != "GET" and not self.token:
            raise GatewayError("Set GITHUB_TOKEN with repository Contents:write permission")
        headers = {"Accept": "application/vnd.github+json", "User-Agent": "agi-swarm-gateway/1.0",
                   "X-GitHub-Api-Version": "2022-11-28"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        if body is not None:
            headers["Content-Type"] = "application/json"
        request = Request(url, data=body, headers=headers, method=method)
        try:
            with urlopen(request, timeout=20) as response:
                return json.load(response)
        except HTTPError as error:
            if error.code == 404:
                raise NotFound(path) from error
            if error.code in (409, 422):
                raise Conflict(f"GitHub rejected concurrent update for {path} (HTTP {error.code})") from error
            raise GatewayError(f"GitHub HTTP {error.code} for {path}") from error
        except (URLError, TimeoutError) as error:
            raise GatewayError(f"GitHub connection failed: {error}") from error

    def read(self, path: str) -> tuple[dict, str]:
        obj = self._request("GET", path)
        if obj.get("type") != "file" or obj.get("encoding") != "base64":
            raise GatewayError(f"Expected a JSON file at {path}")
        try:
            data = json.loads(base64.b64decode(obj["content"]))
        except (ValueError, KeyError, binascii.Error) as error:
            raise GatewayError(f"Invalid JSON at {path}") from error
        if not isinstance(data, dict):
            raise GatewayError(f"Expected JSON object at {path}")
        return data, obj["sha"]

    def write(self, path: str, data: dict, *, sha: str | None = None, message: str) -> None:
        payload = {"branch": self.branch, "message": message,
                   "content": base64.b64encode((json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode()).decode()}
        if sha:
            payload["sha"] = sha
        self._request("PUT", path, payload)

    def list_dir(self, path: str) -> list[dict]:
        try:
            entries = self._request("GET", path)
        except NotFound:
            return []
        if not isinstance(entries, list):
            raise GatewayError(f"Expected directory listing at {path}")
        return entries

    @staticmethod
    def task_path(task_id: str) -> str:
        if not TASK_PATTERN.fullmatch(task_id):
            raise ValueError("invalid task ID")
        return f"{TASK_DIR}/{task_id}.json"

    @staticmethod
    def agent_path(agent: str) -> str:
        if not AGENT_PATTERN.fullmatch(agent):
            raise ValueError("invalid agent name")
        return f"swarm/{agent.lower()}_state.json"

    def agents(self) -> dict[str, dict]:
        result = {}
        for entry in self.list_dir("swarm"):
            name = entry.get("name", "")
            if name.endswith("_state.json") and AGENT_PATTERN.fullmatch(name[:-11]):
                agent = name[:-11]
                result[agent] = self.read(f"swarm/{name}")[0]
        return result

    def tasks(self) -> list[dict]:
        result = []
        for entry in sorted(self.list_dir(TASK_DIR), key=lambda e: e.get("name", "")):
            name = entry.get("name", "")
            if name.endswith(".json") and TASK_PATTERN.fullmatch(name[:-5]):
                result.append(self.read(f"{TASK_DIR}/{name}")[0])
        return result

    def submit(self, description: str, preferred_agent: str | None = None) -> dict:
        if not isinstance(description, str) or not description.strip():
            raise ValueError("task description must be non-empty")
        if preferred_agent:
            self.agent_path(preferred_agent)
            preferred_agent = preferred_agent.lower()
        now = utc_now()
        task_id = now.strftime("%Y%m%dT%H%M%S%fZ") + "-" + uuid.uuid4().hex[:12]
        task = {"id": task_id, "description": description.strip(), "status": "queued",
                "preferred_agent": preferred_agent, "assigned_to": None,
                "created_at": utc_stamp(), "updated_at": utc_stamp(), "result": None}
        self.write(self.task_path(task_id), task, message=f"swarm: enqueue {task_id}")
        return task

    def heartbeat(self, agent: str, *, status: str | None = None,
                  quota_left: float | None = None, current_task: str | None = None) -> dict:
        path = self.agent_path(agent)
        state, sha = self.read(path)
        if status is not None:
            if status not in STATUSES:
                raise ValueError("invalid status")
            state["status"] = status
        if quota_left is not None:
            if isinstance(quota_left, bool) or not 0 <= quota_left <= 100:
                raise ValueError("quota must be a percent from 0 to 100")
            state["quota_left"] = quota_left
        if current_task is not None:
            state["current_task"] = current_task
        state["updated_at"] = utc_stamp()
        self.write(path, state, sha=sha, message=f"swarm: heartbeat {agent.lower()}")
        return state

    def claim_next(self, agent: str) -> dict | None:
        agent = agent.lower()
        self.agent_path(agent)
        states = self.agents()
        if agent not in states or not eligible(states[agent]):
            return None
        # Files are timestamp-prefixed; process oldest first. GitHub remains the
        # source of truth and each write carries the observed blob SHA (CAS).
        for entry in sorted(self.list_dir(TASK_DIR), key=lambda e: e.get("name", "")):
            name = entry.get("name", "")
            if not name.endswith(".json") or not TASK_PATTERN.fullmatch(name[:-5]):
                continue
            path = f"{TASK_DIR}/{name}"
            task, task_sha = self.read(path)
            if task.get("status") != "queued":
                continue
            selected = route_task(task.get("description", ""), task.get("preferred_agent"), states=states)
            if selected != agent:
                continue
            task.update(status="claimed", assigned_to=agent, updated_at=utc_stamp(), claimed_at=utc_stamp())
            try:
                self.write(path, task, sha=task_sha, message=f"swarm: claim {task['id']} for {agent}")
            except Conflict:
                continue
            # Reserve agent with a separate CAS write. The two GitHub files
            # are not a transaction; rollback task if reservation fails.
            state_path = self.agent_path(agent)
            state, state_sha = self.read(state_path)
            if not eligible(state):
                reservation_error = Conflict("agent became unavailable")
            else:
                state.update(current_task=task["id"], status="active", updated_at=utc_stamp())
                try:
                    self.write(state_path, state, sha=state_sha, message=f"swarm: reserve {agent} for {task['id']}")
                    return task
                except (Conflict, GatewayError) as exc:
                    reservation_error = exc
            try:
                current, current_sha = self.read(path)
                if current.get("status") == "claimed" and current.get("assigned_to") == agent:
                    current.update(status="queued", assigned_to=None, updated_at=utc_stamp())
                    current.pop("claimed_at", None)
                    self.write(path, current, sha=current_sha, message=f"swarm: release failed claim {task['id']}")
            except GatewayError as exc:
                raise GatewayError(f"Reservation failed; rollback also failed for {task['id']}: {exc}") from reservation_error
            raise GatewayError(f"Agent reservation failed for {task['id']}: {reservation_error}") from reservation_error
        return None

    def finish(self, task_id: str, agent: str, result: str, *, failed: bool = False) -> dict:
        agent = agent.lower()
        self.agent_path(agent)
        path = self.task_path(task_id)
        task, sha = self.read(path)
        if task.get("status") != "claimed" or task.get("assigned_to") != agent:
            raise Conflict("task is not claimed by this agent")
        task.update(status="failed" if failed else "completed", result=result, updated_at=utc_stamp())
        self.write(path, task, sha=sha, message=f"swarm: {'fail' if failed else 'finish'} {task_id}")
        state_path = self.agent_path(agent)
        state, state_sha = self.read(state_path)
        if state.get("current_task") == task_id:
            state.update(current_task="none", updated_at=utc_stamp())
            self.write(state_path, state, sha=state_sha, message=f"swarm: release {agent} after {task_id}")
        return task

    def reconcile_agent(self, agent: str) -> dict:
        """Clear a stale reservation only if no claimed task belongs to it."""
        state_path = self.agent_path(agent)
        state, sha = self.read(state_path)
        task_id = state.get("current_task")
        if task_id not in (None, "", "none"):
            try:
                task, _ = self.read(self.task_path(task_id))
            except NotFound:
                task = {}
            if task.get("status") == "claimed" and task.get("assigned_to") == agent.lower():
                raise Conflict("task is still claimed; explicitly requeue it first")
            state.update(current_task="none", updated_at=utc_stamp())
            self.write(state_path, state, sha=sha, message=f"swarm: reconcile {agent.lower()}")
        return state

    def requeue(self, task_id: str) -> dict:
        """Manual recovery for a crashed worker; does not cancel active execution."""
        path = self.task_path(task_id)
        task, sha = self.read(path)
        if task.get("status") != "claimed":
            raise Conflict("only claimed tasks can be requeued")
        previous_agent = task.get("assigned_to")
        task.update(status="queued", assigned_to=None, updated_at=utc_stamp(), result=None)
        task.pop("claimed_at", None)
        self.write(path, task, sha=sha, message=f"swarm: requeue {task_id}")
        if previous_agent:
            state_path = self.agent_path(previous_agent)
            state, state_sha = self.read(state_path)
            if state.get("current_task") == task_id:
                state.update(current_task="none", updated_at=utc_stamp())
                self.write(state_path, state, sha=state_sha, message=f"swarm: unreserve {previous_agent}")
        return task


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="GitHub-backed swarm task gateway (control plane only)")
    parser.add_argument("--repo", default=os.environ.get("SWARM_REPO", "Ferrum-Sidereum/agi"))
    parser.add_argument("--branch", default=os.environ.get("SWARM_BRANCH", "dev"))
    commands = parser.add_subparsers(dest="command", required=True)
    submit = commands.add_parser("submit", help="enqueue a task")
    submit.add_argument("description")
    submit.add_argument("--prefer", default=None)
    claim = commands.add_parser("claim", help="claim a queued task for an agent")
    claim.add_argument("--agent", required=True)
    finish = commands.add_parser("finish", help="mark a claimed task completed or failed")
    finish.add_argument("task_id")
    finish.add_argument("--agent", required=True)
    finish.add_argument("--result", required=True)
    finish.add_argument("--failed", action="store_true")
    heartbeat = commands.add_parser("heartbeat", help="report agent liveness / manual quota")
    heartbeat.add_argument("--agent", required=True)
    heartbeat.add_argument("--status", choices=sorted(STATUSES))
    heartbeat.add_argument("--quota", type=float)
    requeue = commands.add_parser("requeue", help="manually recover a stuck claim")
    requeue.add_argument("task_id")
    reconcile = commands.add_parser("reconcile", help="repair stale agent reservation")
    reconcile.add_argument("--agent", required=True)
    commands.add_parser("agents", help="list agent states")
    commands.add_parser("tasks", help="list task records")
    args = parser.parse_args(argv)
    gateway = GitHubGateway(repo=args.repo, branch=args.branch)
    try:
        if args.command == "submit":
            result = gateway.submit(args.description, args.prefer)
        elif args.command == "claim":
            result = gateway.claim_next(args.agent)
        elif args.command == "finish":
            result = gateway.finish(args.task_id, args.agent, args.result, failed=args.failed)
        elif args.command == "heartbeat":
            result = gateway.heartbeat(args.agent, status=args.status, quota_left=args.quota)
        elif args.command == "requeue":
            result = gateway.requeue(args.task_id)
        elif args.command == "reconcile":
            result = gateway.reconcile_agent(args.agent)
        elif args.command == "agents":
            result = gateway.agents()
        else:
            result = gateway.tasks()
    except (GatewayError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
