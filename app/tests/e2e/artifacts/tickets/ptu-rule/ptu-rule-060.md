---
ticket_id: ptu-rule-060
priority: P3
status: in-progress
design_spec: designs/design-level-budget-001.md
domain: scenes
matrix_source:
  rule_ids:
    - scenes-R029
    - scenes-R030
  audit_file: matrix/scenes-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

No PTU level-budget encounter creation formula or significance multiplier. PTU uses level*2*players budget for encounter difficulty and x1-x5 significance for XP scaling. The app uses a density-based spawn system instead.

## Expected Behavior (PTU Rules)

Encounter difficulty is determined by total level budget (sum of opponent levels vs. player level * 2 * party size). Significance multiplier (x1-x5) scales XP rewards.

## Actual Behavior

The density tier system controls spawn count but has no connection to level-based budgeting or significance-based XP scaling.
