---
ticket_id: ptu-rule-045
priority: P3
status: in-progress
design_spec: designs/design-equipment-001.md
domain: combat
matrix_source:
  rule_ids:
    - combat-R134
    - combat-R135
  audit_file: matrix/combat-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Damage Reduction and Evasion Bonus parameters exist in the combat system but no armor or shield equipment system auto-populates them. Values must be manually entered.

## Expected Behavior (PTU Rules)

Per PTU Core: armor provides Damage Reduction, shields provide Evasion Bonuses. These should derive from equipped items.

## Actual Behavior

The parameters are functional if manually set but no equipment/item system feeds into them.
