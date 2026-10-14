"""Offline tests: no network access or GitHub token required."""

import copy
import unittest
from datetime import datetime, timedelta, timezone

from swarm.gateway import Conflict, GatewayError, GitHubGateway
from swarm.protocol import eligible, utc_stamp
from swarm.router import route_task


def state(name, *, quota=90, status="idle", task="none", when=None):
    return {"agent": name, "status": status, "quota_left": quota,
            "current_task": task, "updated_at": when or utc_stamp()}


class MemoryGateway(GitHubGateway):
    """Same read/write contract as the REST adapter, using in-memory CAS."""

    def __init__(self):
        super().__init__(token="test")
        self.store = {}
        self.counter = 0

    def read(self, path):
        if path not in self.store:
            raise GatewayError("not found")
        value, revision = self.store[path]
        return copy.deepcopy(value), str(revision)

    def write(self, path, data, *, sha=None, message):
        if path in self.store:
            if str(self.store[path][1]) != sha:
                raise Conflict("stale revision")
        elif sha is not None:
            raise Conflict("unexpected revision")
        self.counter += 1
        self.store[path] = (copy.deepcopy(data), self.counter)

    def list_dir(self, path):
        prefix = path + "/"
        return [{"name": name[len(prefix):]} for name in self.store
                if name.startswith(prefix) and "/" not in name[len(prefix):]]


class RouterTests(unittest.TestCase):
    def test_preference_and_deterministic_fallback(self):
        agents = {"gpt": state("GPT", quota=70), "claude": state("Claude", quota=90)}
        self.assertEqual(route_task("Review", "GPT", states=agents), "gpt")
        self.assertEqual(route_task("Review", states=agents), "claude")

    def test_busy_low_quota_and_stale_are_excluded(self):
        stale = (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()
        agents = {"gpt": state("GPT", task="one"),
                  "claude": state("Claude", quota=5),
                  "deepseek": state("DeepSeek", when=stale)}
        self.assertIsNone(route_task("Review", preferred_agent="gpt", states=agents))
        self.assertFalse(eligible(state("Broken", quota=float("nan"))))
        self.assertFalse(eligible(state("Broken", status="exhausted")))

    def test_no_default_gpt_fallback(self):
        self.assertIsNone(route_task("Review", states={}))
        with self.assertRaises(ValueError):
            route_task("  ", states={})


class GatewayTests(unittest.TestCase):
    def setUp(self):
        self.g = MemoryGateway()
        self.g.write("swarm/gpt_state.json", state("GPT", quota=80), message="seed")
        self.g.write("swarm/claude_state.json", state("Claude", quota=60), message="seed")

    def test_submit_claim_finish_and_release(self):
        task = self.g.submit("Review PR", "gpt")
        self.assertEqual(task["status"], "queued")
        self.assertEqual(len(self.g.tasks()), 1)
        claimed = self.g.claim_next("gpt")
        self.assertEqual(claimed["id"], task["id"])
        self.assertEqual(claimed["assigned_to"], "gpt")
        self.assertEqual(self.g.agents()["gpt"]["current_task"], task["id"])
        self.assertIsNone(self.g.claim_next("gpt"))
        with self.assertRaises(Conflict):
            self.g.finish(task["id"], "claude", "unauthorized")
        done = self.g.finish(task["id"], "gpt", "Reviewed")
        self.assertEqual(done["status"], "completed")
        self.assertEqual(self.g.agents()["gpt"]["current_task"], "none")

    def test_requeue_after_worker_crash(self):
        task = self.g.submit("Stuck task", "gpt")
        self.g.claim_next("gpt")
        self.g.requeue(task["id"])
        self.assertEqual(self.g.agents()["gpt"]["current_task"], "none")
        self.assertEqual(self.g.claim_next("gpt")["id"], task["id"])

    def test_router_will_not_claim_other_agent_preference_when_available(self):
        task = self.g.submit("Review", "claude")
        self.assertIsNone(self.g.claim_next("gpt"))
        self.assertEqual(self.g.claim_next("claude")["id"], task["id"])

    def test_bad_task_id(self):
        with self.assertRaises(ValueError):
            self.g.finish("../../bad", "gpt", "nope")

    def test_no_duplicate_claim_of_same_task(self):
        task = self.g.submit("Once")
        self.assertIsNotNone(self.g.claim_next("gpt"))
        self.assertIsNone(self.g.claim_next("claude"))
        self.assertEqual(self.g.tasks()[0]["id"], task["id"])


if __name__ == "__main__":
    unittest.main()
