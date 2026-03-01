# Testing Strategy

## Unit Tests (P0)

### `app/tests/unit/utils/sizeCategory.test.ts`

**`sizeToFootprint()`:**
- Returns 1 for 'Small'
- Returns 1 for 'Medium'
- Returns 2 for 'Large'
- Returns 3 for 'Huge'
- Returns 4 for 'Gigantic'
- Returns 1 for undefined
- Returns 1 for null
- Returns 1 for unrecognized string (e.g., 'Colossal')

**`getFootprintCells()`:**
- Returns single cell `[(0,0)]` for size 1 at origin
- Returns 4 cells for size 2 at (3,5): `[(3,5), (4,5), (3,6), (4,6)]`
- Returns 9 cells for size 3 at (1,1): all cells from (1,1) to (3,3)
- Returns 16 cells for size 4 at (0,0): all cells from (0,0) to (3,3)

**`isFootprintInBounds()`:**
- Returns true for size 1 at (0,0) in 10x10 grid
- Returns true for size 2 at (8,8) in 10x10 grid (occupies 8-9, 8-9)
- Returns false for size 2 at (9,9) in 10x10 grid (would occupy 9-10, out of bounds)
- Returns false for size 3 at (8,8) in 10x10 grid
- Returns false for negative coordinates
- Returns true for size 4 at (0,0) in 4x4 grid (exact fit)

### `app/tests/unit/composables/useGridRendering-multiTile.test.ts`

**Movement preview footprint highlight:**
- Large token (2x2) moving to (5,3): highlights cells (5,3), (6,3), (5,4), (6,4)
- Huge token (3x3) moving to (2,2): highlights 9 cells from (2,2) to (4,4)
- Preview arrow points to center of NxN footprint, not origin cell
- Invalid move shows red highlight on all footprint cells
- Out-of-bounds destination: highlights only in-bounds cells, shows invalid

### `app/tests/unit/services/grid-placement-multiTile.test.ts`

**Existing tests (verify still passing):**
- `sizeToTokenSize()` returns correct values for all PTU sizes
- `findPlacementPosition()` avoids overlap for multi-cell tokens
- `buildOccupiedCellsSet()` includes all cells of multi-cell tokens

---

## Unit Tests (P1)

### `app/tests/unit/composables/usePathfinding-multiTile.test.ts`

**`calculatePathCost()` with tokenSize:**

- Size 1 (default): same behavior as before (regression check)
- Size 2 token: path cost accounts for 2x2 passability check
- Size 2 token: returns null when any footprint cell is blocked
- Size 2 token: returns null when any footprint cell has impassable terrain
- Size 2 token: terrain cost is max across all footprint cells
- Size 3 token navigating around blocking terrain: path avoids cells where 3x3 would overlap blocking
- Size 2 token: destination out of grid bounds -> returns null
- Size 4 token: can find path through wide corridor (4+ cells wide)
- Size 4 token: cannot path through 3-cell-wide corridor

**`getMovementRangeCells()` with tokenSize:**

- Size 1 (default): same cells as before (regression check)
- Size 2 token in open grid: reachable cells exclude positions where footprint would go out of bounds
- Size 2 token: blocking terrain within 1 cell of grid edge reduces reachable area
- Size 3 token with speed 5: fewer reachable origin positions than size 1 with speed 5
- Size 2 token: reachable cells correctly exclude positions where any footprint cell is impassable
- Movement range cells are all valid origin positions (footprint fits at each cell)

**`getMovementRangeCellsWithAveraging()` with tokenSize:**

- Size 2 token crossing water/land boundary: terrain types include types from ALL footprint cells
- Speed averaging accounts for terrain types under the full footprint
- Size 2 token with one cell on water, one on land: averaged speed used correctly

### `app/tests/unit/composables/useGridMovement-multiTile.test.ts`

**`getTerrainCostForFootprint()`:**
- All cells normal terrain: returns 1
- One cell slow terrain (cost 2), rest normal: returns 2 (max)
- One cell blocking (Infinity), rest normal: returns Infinity
- All cells water, combatant can swim: returns 1 (per decree-008)
- One cell water (no swim), rest normal: returns Infinity

**`isValidMove()` with multi-cell tokens:**
- Large (2x2) token: valid move to open 2x2 area within speed
- Large (2x2) token: invalid move when destination 2x2 area partially blocked
- Large (2x2) token: invalid move when destination extends beyond grid
- Large (2x2) token: invalid move when any destination cell occupied by another token
- Huge (3x3) token: path cost correctly calculated through terrain
- Token size 1: behavior unchanged (regression)

### `app/tests/unit/stores/fogOfWar-multiTile.test.ts`

**`revealFootprintArea()`:**
- Size 1, radius 2: equivalent to existing `revealArea()` (regression)
- Size 2 at (5,5), radius 2: reveals cells from (3,3) to (8,8) minus corners
- Size 3 at (3,3), radius 1: reveals cells from (2,2) to (6,6) minus corners
- All cells within Chebyshev distance of ANY footprint cell are revealed
- Does not reveal cells outside the effective radius
- Size 4 at (0,0), radius 0: reveals only the 16 footprint cells

---

## Unit Tests (P2)

### `app/tests/unit/composables/useRangeParser-multiTile.test.ts`

**`isTargetHitByAoE()`:**
- Size 1 target, position in affected cells: returns true
- Size 1 target, position NOT in affected cells: returns false
- Size 2 target at (5,5), affected cells include (6,5): returns true (overlap on one cell)
- Size 2 target at (5,5), affected cells only include (7,5): returns false (no overlap)
- Size 3 target at (3,3), burst centered at (5,3): returns true if any of 9 cells overlap
- Size 4 target at (0,0), single affected cell at (3,3): returns true (corner overlap)
- Empty affected cells: returns false for any target

**`getBlastEdgeOrigin()`:**
- Size 1 attacker: returns attacker position regardless of direction
- Size 2 at (3,3), direction north (dx=0, dy=-1): returns (3,3) (top-left edge)
- Size 2 at (3,3), direction east (dx=1, dy=0): returns (4,3) (top-right edge)
- Size 2 at (3,3), direction south (dx=0, dy=1): returns (3,4) (bottom-left edge)
- Size 2 at (3,3), direction southeast (dx=1, dy=1): returns (4,4) (bottom-right edge)
- Size 3 at (1,1), direction west (dx=-1, dy=0): returns (1,1) (left edge)
- Size 3 at (1,1), direction east (dx=1, dy=0): returns (3,1) (right edge)

**`isFlankingTarget()` (spec only -- test when flanking is implemented):**
- Two melee-adjacent attackers on opposite sides of 1x1 target: returns true
- Two melee-adjacent attackers on same side of 1x1 target: returns false
- Two attackers on opposite sides of 2x2 target: returns true
- Two attackers on adjacent sides of 2x2 target: returns false (90 degrees)
- Attacker not adjacent to target: returns false
- 3x3 target with attackers on north and south edges: returns true

### `app/tests/unit/stores/measurement-multiTile.test.ts`

**Edge-to-edge distance measurement:**
- Two 1x1 tokens: distance unchanged (regression)
- 1x1 token at (0,0) and 2x2 token at (3,0): distance = 2 (gap of 2 cells)
- 2x2 token at (0,0) and 2x2 token at (4,0): distance = 2 (gap of 2 cells)
- 3x3 token at (0,0) and 1x1 token at (3,0): distance = 0 (adjacent)
- Diagonal measurement: uses PTU alternating diagonal from nearest edges

---

## Integration Tests

### Multi-Tile Token Rendering (P0)

1. Create encounter, add a Large Pokemon (size 2x2)
2. Verify token renders spanning 2 cells wide and 2 cells tall
3. Verify size badge shows "2x2"
4. Click on any cell of the 2x2 area -> token is selected
5. Verify HP bar spans the full token width

### Multi-Tile Token Placement (P0)

1. Create encounter with 10x10 grid
2. Add Large Pokemon (2x2) -> auto-placed at valid position
3. Add second Large Pokemon (2x2) -> placed without overlapping first
4. Add Huge Pokemon (3x3) -> placed without overlapping either Large
5. Verify all combatants' footprints do not overlap

### Multi-Tile Token Movement (P1)

1. Create encounter, add Large Pokemon (2x2) with Overland 5
2. Enter move mode, hover over cells
3. Verify movement range shows reachable origin positions
4. Verify destination preview shows full 2x2 footprint highlight
5. Move token to valid position -> position updates, all 4 cells occupied
6. Attempt move to position where footprint would go out of bounds -> rejected
7. Attempt move to position where footprint overlaps another token -> rejected

### Multi-Tile Pathfinding Through Terrain (P1)

1. Create encounter with terrain:
   - Blocking wall from (5,0) to (5,5) with a 3-cell gap at (5,6)-(5,8)
2. Add Huge Pokemon (3x3) at (2,2)
3. Attempt to move through the 3-cell gap -> succeeds (3x3 fits through 3-wide gap)
4. Narrow the gap to 2 cells
5. Attempt to move through 2-cell gap -> fails (3x3 cannot fit)

### Multi-Tile Fog of War (P1)

1. Enable fog of war, set default to hidden
2. Move Large Pokemon (2x2) to (5,5)
3. Verify revealed area includes cells visible from all 4 footprint cells
4. Compare with 1x1 token at (5,5) -> Large token reveals a larger area

### AoE vs Multi-Tile Target (P2)

1. Create encounter with Huge Pokemon (3x3) at (5,5)
2. Use Burst 1 centered at (7,5) (just outside the 3x3 footprint)
3. Burst affects (6,5) which is inside the 3x3 footprint -> target is hit
4. Use Burst 1 centered at (9,5) (far from footprint)
5. No overlap with 3x3 footprint -> target is not hit

### Isometric Multi-Tile Rendering (P0)

1. Switch to isometric grid mode
2. Add Large Pokemon (2x2)
3. Verify token sprite covers the full 2x2 isometric diamond area
4. Rotate camera -> token renders correctly at all 4 angles
5. Multiple elevation levels -> token renders at correct depth

---

## Coverage Targets

| Area | Coverage Target |
|------|----------------|
| `sizeCategory.ts` | 100% (pure utility functions) |
| `usePathfinding.ts` (multi-cell additions) | 90%+ (critical pathfinding logic) |
| `useGridMovement.ts` (multi-cell additions) | 90%+ (movement validation) |
| `useRangeParser.ts` (AoE hit detection) | 90%+ (combat accuracy) |
| `fogOfWar.ts` (footprint reveal) | 85%+ (fogRevealFootprintArea) |
| `useGridRendering.ts` (preview changes) | 80%+ (visual rendering) |
| `measurement.ts` (edge distance) | 85%+ (measurement accuracy) |
| `grid-placement.service.ts` | Existing coverage maintained |

---

## Regression Risk Areas

The following existing features must be verified to continue working correctly after multi-tile changes:

1. **1x1 token movement**: All pathfinding changes use `tokenSize ?? 1` default. Existing tests must pass unchanged.
2. **Terrain cost calculation**: The new footprint aggregation should not affect 1x1 tokens (single cell = max of one cell = same as before).
3. **Fog of war**: The new `revealFootprintArea()` with size 1 should produce the same result as `revealArea()`.
4. **AoE targeting**: The new `isTargetHitByAoE()` with size 1 should produce the same result as the current single-cell check.
5. **Isometric rendering**: 1x1 tokens must render identically after multi-cell changes.
6. **WebSocket sync**: Movement preview events must correctly reconstruct footprints on the receiving end.
7. **Undo/redo**: Encounter snapshots include combatant data with `tokenSize`. Restoring a snapshot should correctly render tokens at their original sizes.
