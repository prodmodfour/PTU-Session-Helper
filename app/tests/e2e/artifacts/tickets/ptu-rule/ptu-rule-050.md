---
ticket_id: ptu-rule-050
priority: P3
status: open
domain: capture
matrix_source:
  rule_id: capture-R020
  audit_file: matrix/capture-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

The `pokeBallType` parameter in the capture endpoint is dead code. No ball modifier lookup table exists — the GM must manually calculate ball-specific modifiers and pass them directly.

## Expected Behavior (PTU Rules)

Different Poke Ball types apply specific modifiers to the capture rate (e.g., Great Ball -10, Ultra Ball -15, type-specific balls with conditional bonuses).

## Actual Behavior

The parameter exists but is unused. All ball-specific modifiers must be manually entered by the GM.
