"""Local swarm state contract shared by the router and GitHub gateway."""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Mapping

SWARM_DIR = Path(__file__).resolve().parent
STATUSES = frozenset({"active", "idle", "low_quota", "exhausted"})
MIN_QUOTA = 5.0
DEFAULT_STALE_AFTER = 3600


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def utc_stamp() -> str:
    return utc_now().isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_timestamp(value: str) -> datetime:
    if not isinstance(value, str) or not value:
        raise ValueError("missing timestamp")
    value = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(value)
    return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)


def eligible(state: Mapping, *, now: datetime | None = None,
             stale_after: int = DEFAULT_STALE_AFTER, min_quota: float = MIN_QUOTA) -> bool:
    """Fail closed for missing, busy, stale, exhausted or invalid agent states."""
    if state.get("status") not in {"active", "idle"}:
        return False
    if state.get("current_task", "none") not in (None, "", "none"):
        return False
    quota = state.get("quota_left")
    if isinstance(quota, bool) or not isinstance(quota, (int, float)):
        return False
    if not math.isfinite(quota) or not min_quota < quota <= 100:
        return False
    try:
        observed = parse_timestamp(state.get("updated_at"))
    except (ValueError, TypeError):
        return False
    now = now or utc_now()
    age = (now - observed).total_seconds()
    return -300 <= age <= stale_after


def update_agent_state(agent_name: str, status: str, quota_percent_left: float,
                       current_task: str = "none", *, directory: Path | None = None) -> None:
    """Update a local state file. Does not commit/push it to GitHub."""
    if not agent_name or not agent_name.replace("-", "").replace("_", "").isalnum():
        raise ValueError("invalid agent name")
    if status not in STATUSES or isinstance(quota_percent_left, bool) or not isinstance(quota_percent_left, (int, float)) or not math.isfinite(quota_percent_left) or not 0 <= quota_percent_left <= 100:
        raise ValueError("invalid status or quota percentage")
    root = Path(directory) if directory is not None else SWARM_DIR
    root.mkdir(parents=True, exist_ok=True)
    path = root / f"{agent_name.lower()}_state.json"
    state = {"agent": agent_name, "status": status, "quota_left": quota_percent_left,
             "current_task": current_task, "updated_at": utc_stamp()}
    path.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def check_cluster_quotas(*, directory: Path | None = None) -> dict:
    """Read local snapshots; the gateway reads the same files from GitHub."""
    root = Path(directory) if directory is not None else SWARM_DIR
    result = {}
    if not root.is_dir():
        return result
    for path in sorted(root.glob("*_state.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError(f"Invalid state file: {path.name}")
        result[path.name.removesuffix("_state.json")] = data
    return result
