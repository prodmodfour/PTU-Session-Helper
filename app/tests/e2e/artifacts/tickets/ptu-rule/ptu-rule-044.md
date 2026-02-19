---
ticket_id: ptu-rule-044
priority: P2
status: open
domain: combat
matrix_source:
  rule_ids:
    - combat-R059
    - combat-R060
    - vtt-grid-R022
    - vtt-grid-R028
  audit_files:
    - matrix/combat-audit.md
    - matrix/vtt-grid-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Movement-modifying conditions (Stuck, Slowed) and speed-modifying combat stages/maneuvers (Sprint +50%) are tracked in the combat system but not enforced during VTT grid movement. The grid movement validation ignores these combat state modifiers.

## Expected Behavior (PTU Rules)

- Stuck: cannot shift, movement actions cost double
- Slowed: reduce all movement speeds by half
- Speed CS: modifies effective speed for movement
- Sprint: +50% movement speed for the turn

## Actual Behavior

These conditions/modifiers are displayed in the combat UI but the VTT grid movement system does not read or enforce them when validating click-to-move.
