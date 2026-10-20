# Global checkpoint history — append-only

This log tracks **CLOSED/VERIFIED** global checkpoints, not individual commits or every small task. See `GOALS.md` for the active goal and `PLAN.md` for current subgoals.

**No global checkpoint has been completed yet.** `G-0001` is active and its scheduled-pilot execution remains unverified as of the initial interactive setup.

## Required closure record

### `G-XXXX` — COMPLETE — <UTC time>

- **Goal and frozen acceptance criteria source:** `GOALS.md` at the recorded pre-close commit SHA.
- **Evidence for every criterion:** exact path, assertion/observed test, commit SHA, PASS or FAIL.
- **Adversarial completion audit:** what was checked independently and what could still invalidate the conclusion.
- **What was learned:** surprises, disproved hypotheses, known limitations, remaining risks.
- **Strategic self-question:** what next important question the agent asked itself after completion.
- **Next candidates considered:** >=3 and their trade-offs (or evidence why no defensible successor exists).
- **Selected next checkpoint:** its ID, rationale and link to successor definition; do not start its implementation until next scheduled run.

Never backdate a closure, silently edit prior closures, or mark untested work completed.
