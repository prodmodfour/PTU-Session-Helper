---
ticket_id: refactoring-002
ticket_type: refactoring
priority: P3
status: open
domain: vtt-grid
topic: deprecate-legacy-terrain-types
source: code-review-185 HIGH-2
created_by: slave-collector (plan-20260226-190737)
created_at: 2026-02-26T21:00:00
affected_files:
  - app/types/spatial.ts
  - app/stores/terrain.ts
  - app/composables/useCanvasRendering.ts
  - app/composables/useCanvasDrawing.ts
  - app/composables/useIsometricOverlays.ts
  - app/tests/unit/stores/terrain.test.ts
---

## Summary

Legacy terrain types `'difficult'` and `'rough'` are still valid values in the `TerrainType` union and `TERRAIN_COSTS` map. While `migrateLegacyCell` converts them on import, nothing prevents `setTerrain()` from being called with these types directly, creating inconsistent behavior.

## Problem

If code calls `terrainStore.setTerrain(x, y, 'difficult')`:
- Cell gets `type: 'difficult'` and `flags: { rough: false, slow: false }`
- `getMovementCost` returns 2 (from `TERRAIN_COSTS['difficult']`) — correct for legacy
- But rendering shows legacy brown color without slow flag overlay — inconsistent
- The multi-tag model expects cost to come from the `slow` flag, not the base type

## Suggested Fix

Option A (preferred): Add runtime conversion in `setTerrain` — if type is `'difficult'` or `'rough'`, convert to `'normal'` + appropriate flags (same logic as `migrateLegacyCell`).

Option B: Narrow the `TerrainType` union for non-import contexts by splitting into `LegacyTerrainType` and `ActiveTerrainType`.

## Notes

- TerrainPainter UI already excludes these types from the selector
- This is a latent bug risk, not user-facing yet

## Resolution Log

### Approach: Option A — runtime conversion at all entry points

The `setTerrain()` runtime conversion was already implemented in commit `f10cad0` (prior slave run). This fix extends the protection to other entry points and removes dead code.

### Commits

- `f10cad0` — (prior) Added runtime legacy type conversion in `setTerrain()` — converts 'difficult' to normal + slow, 'rough' to normal + rough
- `2ed952e` — Added legacy type guard to `setPaintMode()` — converts legacy types to normal + appropriate flag
- `d8f04fc` — Removed dead `case 'difficult'` and `case 'rough'` rendering branches from `useCanvasRendering`, `useCanvasDrawing`, `useIsometricOverlays` (93 lines deleted)
- `5627f34` — Added 5 tests for `setPaintMode()` legacy type conversion behavior

### Files Changed

- `app/stores/terrain.ts` — `setPaintMode()` now guards against legacy types
- `app/composables/useCanvasRendering.ts` — Removed dead legacy rendering branches
- `app/composables/useCanvasDrawing.ts` — Removed dead legacy rendering branches
- `app/composables/useIsometricOverlays.ts` — Removed dead legacy rendering branches
- `app/tests/unit/stores/terrain.test.ts` — Added setPaintMode legacy conversion tests

### Remaining Legacy References (intentionally preserved)

- `TerrainType` union in `spatial.ts` — Still includes 'difficult'/'rough' for type-level backward compat (server API validation uses it)
- `TERRAIN_COSTS` and `TERRAIN_COLORS` in `terrain.ts` — Still have entries for legacy types (referenced by type system, harmless)
- `server/api/encounters/[id]/terrain.put.ts` — Accepts legacy types in validation (cells are migrated on client import via `migrateLegacyCell`)
- `migrateLegacyCell` in `terrain.ts` — Still needed for import-time migration of saved data
