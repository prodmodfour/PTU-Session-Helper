---
ticket_id: ptu-rule-057
priority: P3
status: open
domain: encounter-tables
matrix_source:
  rule_id: encounter-tables-R012
  audit_file: matrix/encounter-tables-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

No species diversity enforcement in encounter generation. Independent random draws from the weighted table can produce single-species encounters (e.g., 6 Zubat).

## Expected Behavior

Encounter generation should ensure reasonable species diversity, especially at higher spawn counts.

## Actual Behavior

Each spawn is an independent weighted random draw with no diversity constraint.
