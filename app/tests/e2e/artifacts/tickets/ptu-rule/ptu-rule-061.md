---
ticket_id: ptu-rule-061
priority: P2
status: open
domain: scenes
matrix_source:
  rule_id: scenes-R040
  audit_file: matrix/scenes-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Weather persists indefinitely with no duration counter or automatic expiration. PTU weather effects typically last 5 rounds in combat unless sustained by an ability.

## Expected Behavior (PTU Rules)

Per PTU Core: weather effects from moves last 5 rounds. Weather from abilities persists while the ability user is active. There should be a turn counter that decrements and auto-clears weather.

## Actual Behavior

Weather is set on a scene and persists until manually changed. No round counter, no automatic expiration.
