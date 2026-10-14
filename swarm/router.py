import json
import os
from swarm.protocol import check_cluster_quotas

def route_task(task_description: str, preferred_agent: str = None) -> str:
    """
    Определяет, какому агенту отдать задачу на основе остатка квот
    и доступности коннекторов (GPT с гитхабом, Claude/DeepSeek как мозги).
    """
    quotas = check_cluster_quotas()
    
    # Если явно указан предпочтительный агент и у него есть квота
    if preferred_agent and preferred_agent.lower() in quotas:
        agent_data = quotas[preferred_agent.lower()]
        if agent_data.get("status") != "exhausted" and agent_data.get("quota_left", 0) > 5.0:
            return preferred_agent.lower()

    # Ищем агента с наибольшим остатком квоты, который не занят
    best_agent = None
    max_quota = -1
    
    for agent, data in quotas.items():
        if data.get("status") == "exhausted":
            continue
        q_left = data.get("quota_left", 0)
        if q_left > max_quota:
            max_quota = q_left
            best_agent = agent
            
    return best_agent or "gpt"  # По умолчанию фоллим на GPT со шлюзом

if __name__ == "__main__":
    print("Cluster Quotas Status:", check_cluster_quotas())
    print("Recommended Agent for next task:", route_task("Refactor ComfyUI pipeline"))
