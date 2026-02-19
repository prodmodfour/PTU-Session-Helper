---
ticket_id: ptu-rule-046
priority: P2
status: open
domain: combat
matrix_source:
  rule_ids:
    - combat-R035
    - combat-R037
  audit_file: matrix/combat-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

League battle round structure is incomplete: (1) does not enforce that a player always gets both a trainer turn and a Pokemon turn in each round, and (2) skips the declaration phase (low-to-high speed order) and goes straight to resolution order (high-to-low).

## Expected Behavior (PTU Rules)

League battles: each round has a declaration phase (slowest first) then a resolution phase (fastest first). Each player gets both a trainer action and a Pokemon action per round.

## Actual Behavior

League mode uses the same turn structure as Full Contact — single initiative order, no declaration phase.
