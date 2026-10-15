"""Deterministic admission-based task routing; never invents a fallback agent."""

from __future__ import annotations

from datetime import datetime
from typing import Mapping

from swarm.protocol import DEFAULT_STALE_AFTER, MIN_QUOTA, check_cluster_quotas, eligible


def route_task(task_description: str, preferred_agent: str | None = None, *,
               states: Mapping[str, dict] | None = None,
               stale_after: int = DEFAULT_STALE_AFTER,
               min_quota: float = MIN_QUOTA,
               now: datetime | None = None) -> str | None:
    """Return an available agent, or None when none can safely accept work.

    A preference is soft: if that agent is ineligible, another available agent
    may be returned. Task descriptions are data, not instructions for routing.
    """
    if not isinstance(task_description, str) or not task_description.strip():
        raise ValueError("task_description must be non-empty")
    if stale_after < 0 or min_quota < 0:
        raise ValueError("invalid routing limits")
    snapshot = check_cluster_quotas() if states is None else states
    available = [(name.lower(), float(data["quota_left"]))
                 for name, data in snapshot.items()
                 if isinstance(name, str) and isinstance(data, dict)
                 and eligible(data, now=now, stale_after=stale_after, min_quota=min_quota)]
    if preferred_agent:
        requested = preferred_agent.lower()
        if any(name == requested for name, _ in available):
            return requested
    available.sort(key=lambda item: (-item[1], item[0]))
    return available[0][0] if available else None


if __name__ == "__main__":
    print("Cluster state:", check_cluster_quotas())
    print("Route:", route_task("Integration review"))
