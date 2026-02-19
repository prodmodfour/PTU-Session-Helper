---
ticket_id: ptu-rule-043
priority: P2
status: open
domain: pokemon-lifecycle
matrix_source:
  rule_ids:
    - pokemon-lifecycle-R026
    - pokemon-lifecycle-R027
    - pokemon-lifecycle-R028
    - pokemon-lifecycle-R029
    - pokemon-lifecycle-R031
    - pokemon-lifecycle-R014
    - pokemon-lifecycle-R015
  audit_file: matrix/pokemon-lifecycle-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

No unified level-up workflow exists. Seven PTU level-up automation items are missing: level-up wizard, +1 stat point distribution, move availability check from learnset, evolution level detection, evolution stat recalculation, ability notification at level 20, ability notification at level 40.

## Expected Behavior (PTU Rules)

On level-up: +1 stat point (with Base Relations validation), check learnset for new moves, check evolution level, notify GM of ability milestones (level 20 second ability, level 40 third ability). On evolution: recalculate stats from new base stats.

## Actual Behavior

Level changes are manual edits with no automated consequences. GM must manually check learnset, redistribute stats on evolution, and track ability milestones.
