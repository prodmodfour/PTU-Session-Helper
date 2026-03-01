---
design_id: design-multi-tile-tokens-001
ticket_id: feature-013
category: FEATURE
scope: FULL
domain: vtt-grid
status: design-complete
priority: P1
decrees:
  - decree-002
  - decree-003
  - decree-011
matrix_source:
  - vtt-grid-R003
affected_files:
  - app/components/vtt/VTTToken.vue
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/GroupGridCanvas.vue
  - app/components/vtt/IsometricCanvas.vue
  - app/composables/useGridMovement.ts
  - app/composables/useGridInteraction.ts
  - app/composables/useGridRendering.ts
  - app/composables/useCanvasRendering.ts
  - app/composables/useIsometricRendering.ts
  - app/composables/useIsometricInteraction.ts
  - app/composables/usePathfinding.ts
  - app/composables/useRangeParser.ts
  - app/stores/encounterGrid.ts
  - app/stores/fogOfWar.ts
  - app/stores/measurement.ts
  - app/types/encounter.ts
  - app/types/spatial.ts
  - app/types/character.ts
  - app/server/services/grid-placement.service.ts
  - app/server/services/combatant.service.ts
new_files: []
---

# Design: Multi-Tile Token System

## Summary

Implement PTU Size Category footprints on the VTT grid so that Pokemon and characters render at their correct size: Small/Medium = 1x1, Large = 2x2, Huge = 3x3, Gigantic = 4x4. Currently, all tokens render as 1x1 regardless of entity size. The `tokenSize` field already exists on the `Combatant` type and is populated by `sizeToTokenSize()` in `grid-placement.service.ts`, and VTTToken.vue already uses `token.size` for styling. However, the pathfinding, movement validation, fog of war reveal, terrain cost calculation, AoE hit detection, and measurement tools all operate on single-cell assumptions and must be extended to account for multi-cell footprints.

The system must work in both 2D flat grid and 3D isometric grid modes (feature-002).

## PTU Rules Reference

PTU Core Chapter 7, p.231 (vtt-grid-R003):
> "A combatant's footprint on a grid is determined by their Size. Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4, but you may choose to use other shapes for Pokemon that have different body shapes such as serpents."

This design implements only square footprints (NxN). Non-square shapes (serpent bodies) are deferred as a future enhancement.

## Related Decrees

- **decree-002**: PTU alternating diagonal for all grid distance. Multi-cell distance uses nearest-edge calculation already implemented in `useRangeParser.ptuDistanceTokens()`.
- **decree-003**: All tokens passable; enemy-occupied squares are rough terrain; no stacking. Multi-cell tokens extend the "occupied cells" set and the no-stacking destination check.
- **decree-011**: Speed averaging when path crosses terrain boundaries. Multi-cell tokens must average terrain cost across ALL occupied cells at each step.

## Current State

| Area | Status | Notes |
|------|--------|-------|
| `Combatant.tokenSize` field | EXISTS | Set by `sizeToTokenSize()` on combatant creation |
| `sizeToTokenSize()` mapping | EXISTS | In `grid-placement.service.ts` |
| `VTTToken.vue` multi-cell sizing | PARTIAL | Uses `token.size` for width/height, shows size badge, but position is origin-only |
| `getOccupiedCells()` multi-cell | EXISTS | In `useGridMovement.ts` and `useRangeParser.ts` |
| `ptuDistanceTokens()` multi-cell distance | EXISTS | In `useRangeParser.ts` |
| `findPlacementPosition()` multi-cell | EXISTS | In `grid-placement.service.ts` |
| A* pathfinding multi-cell | MISSING | Single-cell path exploration only |
| Movement validation multi-cell | PARTIAL | `isValidMove()` checks destination footprint bounds/stacking but uses single-cell A* |
| Movement range flood-fill multi-cell | MISSING | Single-cell flood-fill only |
| Fog of war multi-cell reveal | MISSING | Reveals only origin cell on movement |
| Terrain cost multi-cell | MISSING | Reads terrain at single origin cell |
| AoE hit detection multi-cell targets | MISSING | Checks single cell per target |
| Measurement from multi-cell tokens | EXISTS | `ptuDistanceTokens()` handles this |
| Isometric multi-cell rendering | MISSING | Isometric projection for multi-cell tokens not implemented |

## Tier Summary

| Tier | Sections | File | Estimated Effort |
|------|----------|------|------------------|
| P0 | A. Size field propagation, B. Multi-cell token rendering (2D + isometric), C. Cell occupation tracking, D. Placement collision detection, E. No-stacking validation for multi-cell destinations | [spec-p0.md](spec-p0.md) | Medium |
| P1 | F. Multi-cell A* pathfinding, G. Multi-cell movement range (flood-fill), H. Multi-cell terrain cost averaging, I. Fog of war per-cell reveal for large footprints, J. Movement preview for large tokens | [spec-p1.md](spec-p1.md) | High |
| P2 | K. AoE coverage for multi-tile targets, L. Flanking geometry for large tokens, M. Measurement from nearest edge | [spec-p2.md](spec-p2.md) | Medium |

## Atomized Files

- [_index.md](_index.md)
- [shared-specs.md](shared-specs.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [testing-strategy.md](testing-strategy.md)
