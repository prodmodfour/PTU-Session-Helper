---
ticket_id: ptu-rule-053
priority: P2
status: open
domain: healing
matrix_source:
  rule_id: healing-R042
  audit_file: matrix/healing-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Only `drainedAp` is tracked. No scene-end AP refresh, no bound AP tracking, and no total AP pool tracking exist. The AP system is incomplete beyond the drain mechanic.

## Expected Behavior (PTU Rules)

Per PTU Core: characters have an AP pool that fully refreshes at scene end (except drained AP). Bound AP from Features reduces available AP. Total AP = base AP - bound AP - drained AP.

## Actual Behavior

Only `drainedAp` is stored. No total AP, no bound AP, no scene-end refresh trigger.
