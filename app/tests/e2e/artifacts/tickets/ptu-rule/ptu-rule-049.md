---
ticket_id: ptu-rule-049
priority: P2
status: open
domain: capture
matrix_source:
  rule_ids:
    - capture-R002
    - capture-R003
  audit_file: matrix/capture-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Status condition definitions for capture modifiers have two issues: (1) Badly Poisoned is listed as a separate persistent condition; if both Poisoned and Badly Poisoned are applied, it gives +20 capture bonus instead of +10. (2) Bad Sleep volatile condition is entirely missing from status condition definitions.

## Expected Behavior (PTU Rules)

- Poisoned and Badly Poisoned should not stack for capture bonus purposes — only one applies (+10)
- Bad Sleep is a volatile condition that should exist and grant capture modifier

## Actual Behavior

Both Poisoned and Badly Poisoned can contribute to capture rate. Bad Sleep is not defined.
