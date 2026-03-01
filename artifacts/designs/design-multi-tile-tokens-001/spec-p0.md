# P0 Specification: Core Multi-Tile Rendering and Collision

P0 establishes the visual foundation: tokens render at their correct NxN size on both 2D and isometric grids, cell occupation tracking is accurate, and placement/destination validation prevents overlapping footprints.

---

## A. Client-Side Size Category Utility

### New File: `app/utils/sizeCategory.ts`

Create a shared client-side utility that mirrors the server-side `sizeToTokenSize()`:

```typescript
/**
 * PTU Size Category definitions.
 *
 * Size categories determine a combatant's grid footprint:
 * - Small/Medium: 1x1 (1 cell)
 * - Large: 2x2 (4 cells)
 * - Huge: 3x3 (9 cells)
 * - Gigantic: 4x4 (16 cells)
 *
 * Ref: PTU Core Chapter 7, p.231 (vtt-grid-R003)
 */

export type SizeCategory = 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gigantic'

/** Map from PTU size category to grid footprint (cells per side). */
export const SIZE_FOOTPRINT_MAP: Record<SizeCategory, number> = {
  Small: 1,
  Medium: 1,
  Large: 2,
  Huge: 3,
  Gigantic: 4,
}

/**
 * Convert a PTU size category string to token footprint size.
 * Returns 1 for unknown/undefined sizes.
 */
export function sizeToFootprint(size: string | undefined | null): number {
  if (!size) return 1
  return SIZE_FOOTPRINT_MAP[size as SizeCategory] ?? 1
}

/**
 * Get all cells occupied by a token at the given position with the given size.
 * Position is the top-left (min x, min y) cell.
 */
export function getFootprintCells(
  x: number,
  y: number,
  size: number
): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = []
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      cells.push({ x: x + dx, y: y + dy })
    }
  }
  return cells
}

/**
 * Check if all cells of a footprint are within grid bounds.
 */
export function isFootprintInBounds(
  x: number,
  y: number,
  size: number,
  gridWidth: number,
  gridHeight: number
): boolean {
  return x >= 0 && y >= 0 &&
         x + size <= gridWidth &&
         y + size <= gridHeight
}
```

This file is auto-imported by Nuxt (lives in `app/utils/`). Components and composables use these functions instead of hardcoding size logic.

---

## B. Multi-Cell Token Rendering (2D Grid)

### File: `app/components/vtt/VTTToken.vue`

**Current state**: The token already uses `token.size` for width/height calculation and shows a size badge. The `tokenStyle` computed property already multiplies `cellSize * token.size` for both dimensions.

**Changes needed**: None for basic rendering. The existing `tokenStyle` computed property correctly handles multi-cell sizing:

```typescript
// Already correct in VTTToken.vue:
const tokenStyle = computed(() => {
  const size = props.cellSize * props.token.size
  // 2D mode:
  return {
    left: `${props.token.position.x * props.cellSize}px`,
    top: `${props.token.position.y * props.cellSize}px`,
    width: `${size}px`,
    height: `${size}px`,
  }
})
```

**Verify**: The sprite scales correctly when `width` and `height` are larger than `cellSize`. The `.vtt-token__sprite` class uses `width: 100%; height: 100%; object-fit: contain` which naturally scales the sprite to fill the NxN area.

**HP bar positioning**: The HP bar uses `position: absolute; bottom: 2px; left: 10%; right: 10%` which scales proportionally with the token size. No changes needed.

**Label positioning**: The name label uses `position: absolute; bottom: 100%` which positions above the full token area. No changes needed.

### File: `app/composables/useGridRendering.ts`

**Movement range rendering**: The `drawMovementRange()` function renders individual reachable cells. For multi-cell tokens, the movement range overlay should highlight cells where the token's origin CAN be placed (the token occupies cells from origin to origin+size-1). This is handled correctly as long as the pathfinding returns valid origin positions (see P1).

**Movement preview**: The `drawMovementPreview()` function draws an arrow from the moving token's center to the target cell's center. For multi-cell tokens, the target cell highlight should show the full NxN footprint at the destination, not just a single cell:

```typescript
// In drawMovementPreview(), after calculating validity:
if (distance > 0) {
  // Highlight ALL cells the token would occupy at the destination
  const tokenSize = token.size
  for (let dx = 0; dx < tokenSize; dx++) {
    for (let dy = 0; dy < tokenSize; dy++) {
      drawCellHighlight(ctx, {
        x: target.x + dx,
        y: target.y + dy,
        cellSize,
        fillColor: bgColor,
        strokeColor: arrowColor
      })
    }
  }

  // Draw arrow from token center to destination center (center of NxN area)
  const destCenterX = target.x * cellSize + (tokenSize * cellSize) / 2
  const destCenterY = target.y * cellSize + (tokenSize * cellSize) / 2
  drawArrow(ctx, { startX, startY, endX: destCenterX, endY: destCenterY, color: arrowColor })

  // Distance label above destination footprint
  const labelY = target.y * cellSize - 12
  drawDistanceLabel(ctx, {
    x: destCenterX,
    y: labelY,
    text: `${distance}m`,
    color: arrowColor
  })
}
```

The same change applies to `drawExternalMovementPreview()` for group view.

---

## C. Multi-Cell Token Rendering (Isometric Grid)

### File: `app/composables/useIsometricRendering.ts`

The isometric renderer must project multi-cell tokens correctly. A 2x2 token occupies a 2x2 diamond in isometric space. The sprite should be scaled to cover the full isometric footprint.

**Changes needed**:

1. **Token positioning**: Currently, each token is projected from its origin cell `(x, y)` to isometric screen coordinates. For multi-cell tokens, the render position should be the center of the NxN isometric footprint, not the origin cell.

2. **Token sprite scaling**: The sprite width/height in isometric mode should be `tileWidth * size` and `tileHeight * size` (or scaled appropriately for the isometric diamond dimensions).

3. **Depth sorting**: Multi-cell tokens should sort by their center position (or the cell with the maximum `y + x` to ensure correct draw order in isometric projection). The `useDepthSorting` composable may need adjustment.

**Implementation approach**:

```typescript
// When rendering a token with size > 1:
// 1. Calculate the isometric center of the NxN footprint
const footprintCenterX = token.position.x + (token.size - 1) / 2
const footprintCenterY = token.position.y + (token.size - 1) / 2

// 2. Project the center to screen coordinates
const screenPos = gridToScreen(footprintCenterX, footprintCenterY, elevation)

// 3. Scale the sprite to cover the full footprint
const spriteWidth = tileWidth * token.size
const spriteHeight = tileHeight * token.size

// 4. Draw centered on the projected position
ctx.drawImage(sprite,
  screenPos.x - spriteWidth / 2,
  screenPos.y - spriteHeight,
  spriteWidth,
  spriteHeight
)
```

**Isometric hit testing**: The `useIsometricInteraction.ts` composable converts screen coordinates to grid coordinates. The existing `getTokenAtPosition()` in `useGridInteraction.ts` already checks multi-cell bounds, so this should work without changes as long as the grid coordinate conversion is correct.

---

## D. Cell Occupation Tracking

### File: `app/composables/useGridMovement.ts`

**Current state**: `getOccupiedCells()` already iterates over `token.size`:

```typescript
const getOccupiedCells = (excludeCombatantId?: string): GridPosition[] => {
  const occupied: GridPosition[] = []
  options.tokens.value.forEach(token => {
    if (token.combatantId === excludeCombatantId) return
    for (let dx = 0; dx < token.size; dx++) {
      for (let dy = 0; dy < token.size; dy++) {
        occupied.push({
          x: token.position.x + dx,
          y: token.position.y + dy
        })
      }
    }
  })
  return occupied
}
```

**Status**: Already correct. No changes needed for P0.

### File: `app/composables/useGridInteraction.ts`

**Current state**: `getTokenAtPosition()` already checks multi-cell bounds:

```typescript
const getTokenAtPosition = (gridPos: GridPosition): TokenData | undefined => {
  return options.tokens.value.find(token => {
    const right = token.position.x + token.size - 1
    const bottom = token.position.y + token.size - 1
    return gridPos.x >= token.position.x && gridPos.x <= right &&
           gridPos.y >= token.position.y && gridPos.y <= bottom
  })
}
```

**Status**: Already correct. No changes needed for P0.

---

## E. Placement Collision Detection

### File: `app/server/services/grid-placement.service.ts`

**Current state**: `findPlacementPosition()` already uses `canFit()` which checks all cells of a multi-cell token:

```typescript
function canFit(x, y, size, gridWidth, gridHeight, occupiedCells): boolean {
  if (x + size > gridWidth || y + size > gridHeight) return false
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      if (occupiedCells.has(`${x + dx},${y + dy}`)) return false
    }
  }
  return true
}
```

**Status**: Already correct. No changes needed for P0.

### File: `app/composables/useGridMovement.ts` (isValidMove)

**Current state**: `isValidMove()` already checks destination bounds and stacking for multi-cell tokens:

```typescript
// Bounds check (lines 497-498):
const inBounds = toPos.x >= 0 && toPos.x + tokenSize - 1 < gridWidth &&
                 toPos.y >= 0 && toPos.y + tokenSize - 1 < gridHeight

// Stacking check (lines 502-511):
for (let dx = 0; dx < tokenSize && !isOccupied; dx++) {
  for (let dy = 0; dy < tokenSize && !isOccupied; dy++) {
    if (occupiedSet.has(`${toPos.x + dx},${toPos.y + dy}`)) {
      isOccupied = true
    }
  }
}
```

**Status**: Already correct for destination validation. The A* pathfinding used for cost calculation is still single-cell (addressed in P1).

---

## P0 Summary

P0 is primarily a **verification and refinement** tier. The existing codebase already has extensive multi-cell support:

| Feature | Status | P0 Work |
|---------|--------|---------|
| Size-to-footprint mapping | Server-side only | Create client-side utility |
| 2D token rendering | Working | Verify sprite scaling at large sizes |
| Isometric token rendering | Missing | Implement multi-cell isometric projection |
| Cell occupation tracking | Working | No changes |
| Hit testing (click detection) | Working | No changes |
| Placement collision | Working (server) | No changes |
| Destination validation | Working | No changes |
| Movement preview footprint | Partial | Highlight full NxN footprint at destination |

The critical new work in P0 is the **isometric multi-cell rendering** and the **destination footprint highlight** in movement preview. Everything else is already functional.
