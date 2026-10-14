import json
import os
from datetime import datetime

SWARM_DIR = "swarm"

def update_agent_state(agent_name: str, status: str, quota_percent_left: float, current_task: str = "none") -> None:
    """Обновляет статус и остаток квоты агента в репозитории."""
    os.makedirs(SWARM_DIR, exist_ok=True)
    state = {
        "agent": agent_name,
        "status": status, # active, low_quota, exhausted, idle
        "quota_left": quota_percent_left,
        "current_task": current_task,
        "updated_at": datetime.utcnow().isoformat()
    }
    file_path = os.path.join(SWARM_DIR, f"{agent_name.lower()}_state.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def check_cluster_quotas() -> dict:
    """Сводит статусы всех агентов роя для динамического балансировщика задач."""
    cluster_status = {}
    if not os.path.exists(SWARM_DIR):
        return cluster_status
    for filename in os.listdir(SWARM_DIR):
        if filename.endswith("_state.json"):
            agent_name = filename.replace("_state.json", "")
            with open(os.path.join(SWARM_DIR, filename), "r", encoding="utf-8") as f:
                cluster_status[agent_name] = json.load(f)
    return cluster_status
