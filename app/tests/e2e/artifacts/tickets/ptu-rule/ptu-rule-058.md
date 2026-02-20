---
ticket_id: ptu-rule-058
priority: P3
status: in-progress
design_spec: designs/design-density-significance-001.md
domain: encounter-tables
matrix_source:
  rule_ids:
    - encounter-tables-R025
    - encounter-tables-R009
  audit_file: matrix/encounter-tables-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Two conceptual mismatches between app and PTU encounter system: (1) VTT terrain/fog systems are generic tactical tools, not PTU-specific environmental modifier implementations. (2) Density multiplier scales spawn count, but PTU density affects encounter significance/XP reward, not spawn count.

## Expected Behavior (PTU Rules)

Density affects the significance and XP value of encounters. Environmental modifiers affect terrain and encounter difficulty per habitat.

## Actual Behavior

Density is used as a spawn count multiplier. Environmental effects are generic VTT features unconnected to PTU habitat rules.
