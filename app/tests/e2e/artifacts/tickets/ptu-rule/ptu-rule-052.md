---
ticket_id: ptu-rule-052
priority: P2
status: open
domain: healing
matrix_source:
  rule_id: healing-R034
  audit_file: matrix/healing-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Extended Rest resets all daily-frequency moves unconditionally instead of only refreshing moves that were not used since the previous day (the "rolling window" rule).

## Expected Behavior (PTU Rules)

Per PTU Core: Extended Rest refreshes daily-use moves, but only those not used since the character's last Extended Rest. A move used today cannot be refreshed by tonight's Extended Rest — it requires waiting until the next day's rest.

## Actual Behavior

All daily moves are reset to available on Extended Rest regardless of when they were last used.
