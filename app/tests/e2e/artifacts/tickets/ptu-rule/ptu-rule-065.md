---
ticket_id: ptu-rule-065
priority: P1
status: open
domain: combat
source: code-review-079
created_at: 2026-02-20
created_by: senior-reviewer
---

## Summary

Encounter end does not clear `boundAp` for human combatants. PTU Core p.59 states Stratagems "automatically unbind when combat ends." The encounter end handler should clear `boundAp: 0` and recalculate `currentAp` for all human combatants with an `entityId`.

## Expected Behavior (PTU Rules)

Per PTU Core (p.59): "[Stratagem] Features may only be bound during combat and automatically unbind when combat ends."

When an encounter ends via `POST /api/encounters/:id/end`, all trainers who had AP bound in Stratagems should have their `boundAp` cleared to 0 and `currentAp` recalculated to `maxAp - drainedAp`.

## Actual Behavior

The encounter end endpoint (`app/server/api/encounters/[id]/end.post.ts`) clears volatile conditions and resets scene-frequency moves, but does not touch `boundAp` or `currentAp` for human combatants. A trainer with 2 AP bound in a Stratagem retains that penalty until the scene also ends.

## Files to Change

- `app/server/api/encounters/[id]/end.post.ts` -- add `boundAp: 0` clearing and `currentAp` recalculation for human combatants with `entityId`

## Notes

The scene deactivation endpoint (`deactivate.post.ts`) correctly clears `boundAp`, but encounters can end independently of scenes (e.g., GM ends combat mid-scene). Both paths need to handle this.
