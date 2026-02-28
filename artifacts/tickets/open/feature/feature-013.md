---
id: feature-013
title: Multi-Tile Token System
priority: P1
severity: HIGH
status: open
domain: vtt-grid
source: matrix-gap (VTT SG-1)
matrix_source: vtt-grid R003
created_by: master-planner
created_at: 2026-02-28
---

# feature-013: Multi-Tile Token System

## Summary

All VTT tokens render as 1x1 regardless of Pokemon size. Large (2x2), Huge (3x3), and Gigantic (4x4) Pokemon should occupy multiple grid cells per PTU size categories. This affects movement, targeting, flanking, and AoE calculations.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R003 | Size Category Footprints | Partial — tokens rendered as 1x1, no multi-tile support |

## PTU Rules

- Chapter 10: Pokemon Size Categories
- Small: 1x1 (can share space)
- Medium: 1x1
- Large: 2x2
- Huge: 3x3
- Gigantic: 4x4
- Size affects: occupied cells, movement blocking, flanking requirements, AoE coverage

## Implementation Scope

FULL-scope feature requiring design spec. Affects core VTT systems: token rendering, movement pathfinding, collision detection, AoE targeting, fog of war.

## Affected Areas

- `app/components/vtt/VTTToken.vue` — multi-cell rendering
- `app/composables/useGridMovement.ts` — multi-cell pathfinding
- `app/composables/useGridInteraction.ts` — multi-cell click targets
- `app/stores/encounterGrid.ts` — cell occupation tracking
- `app/stores/fogOfWar.ts` — multi-cell fog reveal
- `app/types/encounter.ts` — combatant size field
