---
id: feature-015
title: Speed CS Movement Integration
priority: P1
severity: HIGH
status: open
domain: vtt-grid
source: matrix-gap (VTT SG-3)
matrix_source: vtt-grid R026, R027
created_by: master-planner
created_at: 2026-02-28
---

# feature-015: Speed CS Movement Integration

## Summary

Speed Combat Stages are tracked and applied to initiative and evasion but do not affect movement range on the VTT grid. Per PTU rules, each Speed CS level adds/subtracts 1 meter of movement. 2 matrix rules classified as Missing.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R026 | Speed CS Affect Movement | Missing — no Speed CS integration into movement range |
| R027 | Speed CS Movement Floor | Missing — no minimum 2 movement floor when Speed CS negative |

## PTU Rules

- Chapter 7: Speed Combat Stages
- Each +1 Speed CS = +1 meter movement per turn
- Each -1 Speed CS = -1 meter movement per turn
- Minimum movement: 2 meters (even at CS -6)
- Applies to all movement types (Overland, Swim, Burrow, etc.)

## Implementation Scope

PARTIAL-scope — can be implemented directly without a design spec. Modify movement range calculation in grid composable to factor in Speed CS.

## Affected Areas

- `app/composables/useGridMovement.ts` — movement range calculation
- `app/stores/encounterGrid.ts` — movement preview
- `app/server/services/combatant.service.ts` — speed CS tracking (already exists)
