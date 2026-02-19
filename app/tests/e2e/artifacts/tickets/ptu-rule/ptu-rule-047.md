---
ticket_id: ptu-rule-047
priority: P2
status: open
domain: combat
matrix_source:
  rule_ids:
    - combat-R092
    - combat-R098
  audit_file: matrix/combat-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Condition clearing on state transitions is too aggressive or absent: (1) Fainting clears ALL conditions including "Other" type, but PTU only clears Persistent and Volatile. (2) Ending an encounter does not automatically clear volatile conditions from combatants.

## Expected Behavior (PTU Rules)

- Faint: clears Persistent and Volatile conditions only, not "Other" conditions
- Encounter end: all Volatile conditions should be cleared automatically

## Actual Behavior

Faint clears everything. Encounter end clears nothing.
