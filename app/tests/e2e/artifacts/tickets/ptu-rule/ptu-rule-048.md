---
ticket_id: ptu-rule-048
priority: P3
status: open
domain: combat
matrix_source:
  rule_id: combat-R010
  audit_file: matrix/combat-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Evasion combat stage is treated as an independent additive modifier rather than being derived from the stat-based evasion value as PTU defines. The combat stage applies a flat modification rather than the PTU multiplier table.

## Expected Behavior (PTU Rules)

Evasion is stat-derived and combat stages apply multipliers per the CS table (e.g., CS +1 = x1.2, CS +2 = x1.4).

## Actual Behavior

Evasion CS is applied as an additive modifier to the accuracy threshold check.
