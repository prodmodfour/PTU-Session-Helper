---
id: feature-019
title: VTT Status-Movement Integration
priority: P2
severity: MEDIUM
status: open
domain: vtt-grid
source: matrix-gap (VTT SG-4)
matrix_source: vtt-grid R022, R024, R025
created_by: master-planner
created_at: 2026-02-28
---

# feature-019: VTT Status-Movement Integration

## Summary

Status conditions that affect movement (Stuck, Slowed, Tripped) are tracked in combat but not integrated into VTT movement validation. GM can move Stuck tokens, Slowed tokens have full movement range, and Tripped tokens can move without standing up. 3 matrix rules classified as Partial.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R022 | Stuck Condition — No Movement | Partial — Stuck tracked, movement not blocked |
| R024 | Slowed Condition — Half Movement | Partial — Slowed tracked, range not halved |
| R025 | Tripped Condition — Stand Up Cost | Partial — Tripped tracked, no stand-up-first enforcement |

## PTU Rules

- Chapter 7: Movement-affecting conditions
- Stuck: cannot move (0 movement)
- Slowed: movement halved (round down)
- Tripped: must use Shift Action to stand up before moving

## Implementation Scope

PARTIAL-scope — can be implemented directly. Modify movement range calculation and pathfinding to check active status conditions.

## Affected Areas

- `app/composables/useGridMovement.ts` — movement range + validation
- `app/stores/encounterGrid.ts` — movement preview
