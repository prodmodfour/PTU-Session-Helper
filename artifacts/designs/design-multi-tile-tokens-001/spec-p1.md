# P1 Specification: Movement Integration

P1 extends the pathfinding, movement range, terrain cost, fog of war, and movement preview systems to correctly handle multi-cell token footprints. This is the highest-effort tier because pathfinding touches every movement-related code path.

---

## F. Multi-Cell A* Pathfinding

### File: `app/composables/usePathfinding.ts`

**Current state**: Both `calculatePathCost()` (A*) and `getMovementRangeCells()` (flood-fill) explore one cell at a time. They check terrain cost and elevation at a single `(nx, ny)` position per step. For multi-cell tokens, every step must verify that ALL cells in the footprint are passable and aggregate the terrain costs.

### Design: Footprint-Aware A*

Add a `tokenSize` parameter to `calculatePathCost()`. When `tokenSize > 1`, each neighbor exploration checks all cells of the footprint at the candidate position.

**Function signature change**:

```typescript
function calculatePathCost(
  from: GridPosition,
  to: GridPosition,
  blockedCells: GridPosition[],
  getTerrainCost?: TerrainCostGetter,
  getElevationCost?: ElevationCostGetter,
  getTerrainElevation?: TerrainElevationGetter,
  fromElevation?: number,
  tokenSize?: number  // NEW: footprint size (default 1)
): { cost: number; path: GridPosition[] } | null
```

**Neighbor exploration change**:

```typescript
// For each direction (dx, dy):
const nx = current.node.x + dx
const ny = current.node.y + dy
const size = tokenSize ?? 1

// Check ALL cells in the footprint at (nx, ny)
let maxTerrainMultiplier = 1
let isPassable = true
for (let fx = 0; fx < size && isPassable; fx++) {
  for (let fy = 0; fy < size && isPassable; fy++) {
    const cellX = nx + fx
    const cellY = ny + fy
    const cellKey = `${cellX},${cellY}`

    // Check blocked
    if (blockedSet.has(cellKey)) {
      isPassable = false
      break
    }

    // Check terrain
    if (getTerrainCost) {
      const cellTerrain = getTerrainCost(cellX, cellY)
      if (!isFinite(cellTerrain)) {
        isPassable = false
        break
      }
      maxTerrainMultiplier = Math.max(maxTerrainMultiplier, cellTerrain)
    }
  }
}

if (!isPassable) continue

// Use maximum terrain multiplier across the footprint
let stepCost = baseCost * maxTerrainMultiplier
```

**Destination check**: The destination `to` position is validated against the full footprint bounds and passability at the start of the function:

```typescript
// Check if all cells of destination footprint are passable
const size = tokenSize ?? 1
for (let fx = 0; fx < size; fx++) {
  for (let fy = 0; fy < size; fy++) {
    const cellKey = `${to.x + fx},${to.y + fy}`
    if (blockedSet.has(cellKey)) return null
    if (getTerrainCost) {
      const cost = getTerrainCost(to.x + fx, to.y + fy)
      if (!isFinite(cost)) return null
    }
  }
}
```

**Elevation handling**: For multi-cell tokens, elevation is read from the footprint's origin cell `(nx, ny)`. This is a simplification; full per-cell elevation would require averaging or max. Since elevation terrain is typically applied to entire regions, using the origin cell is acceptable.

**Heuristic**: The A* heuristic uses `ptuDiagonalDistance` from origin to destination. This remains admissible for multi-cell tokens because the origin-to-origin distance is always a lower bound on the actual path cost.

### Backwards Compatibility

The `tokenSize` parameter defaults to `1`, preserving all existing call sites. Only multi-cell callers need to pass it.

---

## G. Multi-Cell Movement Range (Flood-Fill)

### File: `app/composables/usePathfinding.ts`

Both `getMovementRangeCells()` and `getMovementRangeCellsWithAveraging()` need the same multi-cell footprint extension.

**Function signature change**:

```typescript
function getMovementRangeCells(
  origin: GridPosition,
  speed: number,
  blockedCells: GridPosition[],
  getTerrainCost?: TerrainCostGetter,
  getElevationCost?: ElevationCostGetter,
  getTerrainElevation?: TerrainElevationGetter,
  originElevation?: number,
  tokenSize?: number  // NEW: footprint size (default 1)
): GridPosition[]
```

**Exploration change**: Same as A* above. Each candidate position `(nx, ny)` is checked for the full NxN footprint:

```typescript
// For each neighbor direction:
const nx = x + dx
const ny = y + dy
const size = tokenSize ?? 1

// Verify all footprint cells are passable
let isPassable = true
let maxTerrainMultiplier = 1
for (let fx = 0; fx < size && isPassable; fx++) {
  for (let fy = 0; fy < size && isPassable; fy++) {
    const cellKey = `${nx + fx},${ny + fy}`
    if (blockedSet.has(cellKey)) { isPassable = false; break }
    if (getTerrainCost) {
      const cost = getTerrainCost(nx + fx, ny + fy)
      if (!isFinite(cost)) { isPassable = false; break }
      maxTerrainMultiplier = Math.max(maxTerrainMultiplier, cost)
    }
  }
}
if (!isPassable) continue
```

**Performance consideration**: For a Gigantic (4x4) token, each step checks 16 cells instead of 1. The flood-fill explores up to `speed * speed * 4` cells (generous estimate). With a typical speed of 5-7 and 16 cells per check, this is ~1500-3000 cell checks per movement range calculation. This is well within interactive performance budget.

**Grid bounds**: The flood-fill must skip positions where the footprint would extend beyond grid bounds:

```typescript
if (nx < 0 || ny < 0 || nx + size > gridWidth || ny + size > gridHeight) continue
```

**Note**: The grid bounds check requires passing `gridWidth` and `gridHeight` to the flood-fill. These are currently not parameters. Options:
1. Add `gridWidth`/`gridHeight` parameters (cleanest)
2. Accept out-of-bounds cells and let the renderer clip them (simpler but wastes computation)

**Recommendation**: Add `gridBounds?: { width: number; height: number }` optional parameter. When provided, positions where the footprint exceeds bounds are skipped. When not provided, behavior is unchanged (unbounded exploration, same as today).

### `getMovementRangeCellsWithAveraging()` Changes

Same footprint check as above, plus the terrain type tracking must include ALL cells in the footprint:

```typescript
// Build terrain types set for this path
const pathTerrainTypes = new Set(current.terrainTypes)
for (let fx = 0; fx < size; fx++) {
  for (let fy = 0; fy < size; fy++) {
    pathTerrainTypes.add(getTerrainType(nx + fx, ny + fy))
  }
}
```

---

## H. Multi-Cell Terrain Cost Averaging

### File: `app/composables/useGridMovement.ts`

**`getTerrainCostForCombatant()`**: Currently checks terrain at a single `(x, y)`. For multi-cell tokens, the cost should be the maximum across all occupied cells (see shared-specs.md for rationale).

**New function**: `getTerrainCostForFootprint()`:

```typescript
/**
 * Get terrain cost for a multi-cell footprint at position (x, y).
 * Returns the maximum terrain cost across all cells in the footprint.
 * Returns Infinity if ANY cell is impassable.
 */
const getTerrainCostForFootprint = (
  x: number,
  y: number,
  size: number,
  combatantId: string
): number => {
  let maxCost = 0
  for (let fx = 0; fx < size; fx++) {
    for (let fy = 0; fy < size; fy++) {
      const cellCost = getTerrainCostForCombatant(x + fx, y + fy, combatantId)
      if (!isFinite(cellCost)) return Infinity
      maxCost = Math.max(maxCost, cellCost)
    }
  }
  return maxCost
}
```

**`getTerrainCostGetter()` change**: Return a footprint-aware getter when the combatant has `tokenSize > 1`:

```typescript
const getTerrainCostGetter = (
  combatantId?: string,
  tokenSize?: number
): TerrainCostGetter | undefined => {
  if (terrainStore.terrainCount === 0) return undefined
  const size = tokenSize ?? 1
  if (combatantId && size > 1) {
    return (x: number, y: number) => getTerrainCostForFootprint(x, y, size, combatantId)
  }
  if (combatantId) {
    return (x: number, y: number) => getTerrainCostForCombatant(x, y, combatantId)
  }
  return getTerrainCostAt
}
```

**Note**: The `TerrainCostGetter` type `(x: number, y: number) => number` is already a closure that encapsulates the footprint size. The A* and flood-fill algorithms call it with the origin position `(x, y)` and get back the aggregated cost for the full footprint. This means the pathfinding algorithms themselves do NOT need to know about footprint size for terrain cost -- the cost getter handles it. However, they still need `tokenSize` for the blocked-cell and bounds checks (see section F/G).

**Alternative approach**: Instead of a footprint-aware terrain cost getter, pass `tokenSize` to the pathfinding and let it iterate over the footprint internally. This is the approach chosen in section F/G for blocked cells and bounds. For terrain costs, using the closure approach keeps the pathfinding code cleaner.

**Combined approach (recommended)**: The pathfinding receives `tokenSize` and handles blocked-cell checks and bounds checks internally. The terrain cost getter is footprint-aware and handles terrain aggregation. This divides responsibility cleanly:
- Pathfinding: spatial checks (bounds, blocked cells)
- Terrain cost getter: terrain-specific logic (passability, cost multipliers, Naturewalk)

---

## I. Fog of War Per-Cell Reveal for Large Token Footprints

### File: `app/stores/fogOfWar.ts`

**Current state**: Fog reveal is triggered when a token moves. The reveal area is based on the token's origin position. For multi-cell tokens, the reveal should cover cells visible from ANY cell in the footprint.

**Design**: Add a `revealFootprintArea()` action that reveals cells around the full footprint:

```typescript
/**
 * Reveal cells visible from a multi-cell token footprint.
 * For a token at (x, y) with size s, reveals a Chebyshev-radius area
 * around every cell in the footprint, then deduplicates.
 *
 * This effectively reveals a larger area because the "eyes" of a large
 * token see from every cell they occupy.
 */
revealFootprintArea(
  originX: number,
  originY: number,
  size: number,
  radius: number
) {
  // For efficiency, compute the expanded bounding box:
  // min corner: (originX - radius, originY - radius)
  // max corner: (originX + size - 1 + radius, originY + size - 1 + radius)
  const minX = originX - radius
  const maxX = originX + size - 1 + radius
  const minY = originY - radius
  const maxY = originY + size - 1 + radius

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      // Check if (x, y) is within Chebyshev radius of ANY footprint cell
      const distToFootprint = chebyshevDistanceToRect(
        x, y,
        originX, originY,
        originX + size - 1, originY + size - 1
      )
      if (distToFootprint <= radius) {
        this.revealCell(x, y)
      }
    }
  }
}
```

**Helper function** (pure, can be in utils or inline):

```typescript
/**
 * Chebyshev distance from point (px, py) to the nearest cell in
 * the rectangle defined by (x1, y1) to (x2, y2).
 */
function chebyshevDistanceToRect(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const dx = Math.max(0, x1 - px, px - x2)
  const dy = Math.max(0, y1 - py, py - y2)
  return Math.max(dx, dy)
}
```

**Callers**: The GM view triggers fog reveal on token movement. The call site (in the page component or composable that handles `tokenMove` events) should use `revealFootprintArea()` with the token's size instead of `revealArea()` with the origin cell only.

---

## J. Movement Preview for Large Tokens

### File: `app/composables/useGridRendering.ts`

**`drawMovementPreview()` changes** (expanding on P0 section B):

1. **Destination highlight**: Draw the full NxN footprint at the destination position. Each cell in the footprint gets highlighted with the valid/invalid color.

2. **Arrow endpoint**: The arrow should point to the center of the NxN destination footprint, not to a single cell center:
   ```typescript
   const destCenterX = target.x * cellSize + (tokenSize * cellSize) / 2
   const destCenterY = target.y * cellSize + (tokenSize * cellSize) / 2
   ```

3. **Distance label**: Position above the destination footprint (above the top row of cells).

4. **Out-of-bounds visual**: If the destination would place any footprint cell outside the grid, show the invalid highlight on the in-bounds cells and skip out-of-bounds cells.

### File: `app/composables/useGridRendering.ts`

**`drawMovementRange()` changes**:

The movement range overlay highlights all cells where the token's origin CAN be placed. Since the flood-fill already accounts for the full footprint (per section G), the returned `rangeCells` are valid origin positions. The rendering highlights individual cells as "reachable origins."

For visual clarity with large tokens, optionally render a ghost outline of the full footprint at the hovered cell position:

```typescript
// When hovering over a movement range cell with a large token selected:
if (hoveredCell && tokenSize > 1) {
  // Draw ghost footprint outline at hovered position
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.strokeRect(
    hoveredCell.x * cellSize,
    hoveredCell.y * cellSize,
    tokenSize * cellSize,
    tokenSize * cellSize
  )
  ctx.setLineDash([])
}
```

This gives the GM visual feedback of where the large token would land before committing the move.

### File: `app/composables/useGridMovement.ts`

**`isValidMove()` changes**:

The function already handles multi-cell bounds and stacking checks. The remaining change is to pass `tokenSize` through to the A* pathfinding:

```typescript
// In the terrain-aware branch:
const pathResult = calculatePathCost(
  fromPos, toPos, blockedCells, terrainCostGetter,
  elevCostGetter, terrainElevGetter, fromElev,
  tokenSize  // NEW: pass token footprint size
)
```

And pass `tokenSize` to the terrain cost getter construction (section H).

### File: `app/composables/useGridInteraction.ts`

**Movement target interpretation**: When a GM clicks to move a multi-cell token, the clicked cell becomes the token's new origin (top-left). The full NxN footprint expands to the right and down from the clicked cell. This is consistent with the existing placement convention.

No code change needed for the click interpretation. The `handleMouseDown` handler already passes `gridPos` (the clicked cell) as the destination to `isValidMove()`, which then checks the full footprint at that position.

---

## P1 Summary

| Feature | File | Change Type |
|---------|------|-------------|
| Multi-cell A* pathfinding | usePathfinding.ts | Add `tokenSize` param, footprint passability check |
| Multi-cell flood-fill | usePathfinding.ts | Add `tokenSize` param, footprint passability check |
| Multi-cell flood-fill (averaging) | usePathfinding.ts | Add `tokenSize` param, multi-cell terrain type tracking |
| Footprint terrain cost | useGridMovement.ts | New `getTerrainCostForFootprint()`, updated getter |
| Fog reveal for footprints | fogOfWar.ts | New `revealFootprintArea()` action |
| Movement preview footprint | useGridRendering.ts | NxN destination highlight, ghost outline on hover |
| isValidMove tokenSize | useGridMovement.ts | Pass `tokenSize` to A* pathfinding |
| Grid bounds for flood-fill | usePathfinding.ts | Optional `gridBounds` parameter |
