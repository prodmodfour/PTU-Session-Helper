---
ticket_id: ptu-rule-059
priority: P2
status: open
domain: scenes
matrix_source:
  rule_id: scenes-R025
  audit_file: matrix/scenes-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Scene-frequency move tracking fields exist in the database but are never enforced. `usedThisScene` is never incremented, no per-scene limit validation occurs, and no "Every Other Turn" frequency restriction is implemented.

## Expected Behavior (PTU Rules)

Moves with scene-frequency limits (1/scene, 2/scene) should be tracked and enforced. "Every Other Turn" moves should alternate availability. At scene end, scene-use counters should reset.

## Actual Behavior

The DB fields exist but are never read or written during move execution. All moves can be used unlimited times per scene.
