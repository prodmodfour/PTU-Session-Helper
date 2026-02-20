---
ticket_id: ptu-rule-055
priority: P3
status: in-progress
design_spec: designs/design-xp-system-001.md
domain: pokemon-lifecycle
matrix_source:
  rule_id: pokemon-lifecycle-R058
  audit_file: matrix/pokemon-lifecycle-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

No post-combat XP calculation exists. Experience points are manually entered by the GM after encounters.

## Expected Behavior (PTU Rules)

Per PTU Core: after combat, XP is calculated based on opponent levels and distributed to participating Pokemon.

## Actual Behavior

No XP calculation or distribution system. The GM manually updates each Pokemon's experience field.
