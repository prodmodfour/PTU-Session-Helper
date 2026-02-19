---
ticket_id: ptu-rule-054
priority: P3
status: open
domain: pokemon-lifecycle
matrix_source:
  rule_id: pokemon-lifecycle-R010
  audit_file: matrix/pokemon-lifecycle-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Base Relations Rule is not enforced during stat point distribution. The weighted random algorithm can produce stat allocations that violate the required ordering where higher base stats should receive more points.

## Expected Behavior (PTU Rules)

Per PTU Core: stat points should be distributed respecting Base Relations — a Pokemon's highest base stat should receive the most points, and the relative ordering of stats should be maintained after distribution.

## Actual Behavior

The weighted random distribution makes higher base stats more likely to receive points but does not guarantee the required ordering is maintained.
