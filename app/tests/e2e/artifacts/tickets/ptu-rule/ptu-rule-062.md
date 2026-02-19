---
ticket_id: ptu-rule-062
priority: P2
status: open
domain: vtt-grid
matrix_source:
  rule_ids:
    - vtt-grid-R012
    - vtt-grid-R013
  audit_file: matrix/vtt-grid-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Two terrain/movement type gaps: (1) Earth terrain type (requires Burrow to traverse) is absent; Water terrain has `canSwim` hardcoded to false making all water impassable to all entities. (2) Movement capability types are defined in types but speed selection ignores terrain context — all movement uses a single flat speed value regardless of terrain (swim speed for water, burrow speed for earth, etc.).

## Expected Behavior (PTU Rules)

Per PTU Core: different terrain types require different movement capabilities (Swim for Water, Burrow for Earth, Fly to ignore most terrain). Speed should match the appropriate movement type for the terrain being traversed.

## Actual Behavior

Only Overland speed is used. Water is universally impassable. Earth terrain doesn't exist. Flying/Swimming/Burrowing speeds are stored but never selected based on terrain.
