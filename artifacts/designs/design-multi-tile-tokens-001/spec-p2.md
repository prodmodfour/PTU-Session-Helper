# P2 Specification: Combat Integration

P2 extends AoE hit detection, flanking geometry, and measurement tools to correctly interact with multi-tile targets. These features build on the multi-cell distance and occupied-cell infrastructure from P0/P1.

---

## K. AoE Coverage Calculation for Multi-Tile Targets

### File: `app/composables/useRangeParser.ts`

**Current state**: `getAffectedCells()` returns a list of grid cells affected by an AoE. Combat resolution then checks if a target's position is in the affected set. For 1x1 tokens, this is a simple `target.position in affectedCells` check. For multi-cell tokens, the target is hit if ANY cell of its footprint overlaps with the AoE.

**New function**: `isTargetHitByAoE()`:

```typescript
/**
 * Check if a multi-cell target is hit by an AoE effect.
 *
 * PTU Rule: A multi-cell target is hit if ANY cell of its footprint
 * overlaps with the AoE's affected cells. This is the standard
 * tabletop interpretation for large creatures in area effects.
 *
 * @param targetPosition - Top-left position of the target
 * @param targetSize - Footprint size (1 for Small/Medium, 2 for Large, etc.)
 * @param affectedCells - Cells covered by the AoE
 * @returns true if any footprint cell is in the affected area
 */
function isTargetHitByAoE(
  targetPosition: GridPosition,
  targetSize: number,
  affectedCells: GridPosition[]
): boolean {
  const affectedSet = new Set(
    affectedCells.map(c => `${c.x},${c.y}`)
  )

  for (let dx = 0; dx < targetSize; dx++) {
    for (let dy = 0; dy < targetSize; dy++) {
      if (affectedSet.has(`${targetPosition.x + dx},${targetPosition.y + dy}`)) {
        return true
      }
    }
  }

  return false
}
```

**Integration point**: The combat system's AoE resolution (in `useCombat.ts` or the move execution endpoint) currently does something like:

```typescript
// Current: single-cell check
const isHit = affectedCells.some(c =>
  c.x === target.position.x && c.y === target.position.y
)
```

This must change to:

```typescript
// New: multi-cell footprint check
const isHit = isTargetHitByAoE(
  target.position,
  target.tokenSize,
  affectedCells
)
```

**AoE origin from multi-cell attacker**: When a multi-cell attacker uses an AoE, the origin of the AoE can be any cell adjacent to the attacker's footprint (for Close Blast) or centered on a point within range (for Burst). The existing `getAffectedCells()` function takes an `origin` parameter that is set by the GM's click. No changes needed for origin selection -- the GM clicks the cell where the AoE is centered.

For **Close Blast**, the origin should be adjacent to the attacker's footprint (not just the origin cell). The GM currently clicks the direction, and the blast is placed adjacent to the attacker. For multi-cell attackers, "adjacent" means adjacent to any cell of the footprint. The existing implementation places the blast relative to `origin + direction`, where `origin` is the attacker's origin cell. This should be updated to use the nearest edge cell of the footprint in the blast direction:

```typescript
/**
 * Get the edge cell of a token footprint closest to the blast direction.
 * For a 2x2 token at (3,3) blasting north (dy=-1):
 *   Edge cells: (3,3) and (4,3) -- both have minimum y
 *   Return: center of edge = (3.5, 3) -> round to (3, 3) or (4, 3)
 *
 * For simplicity, return the corner cell of the footprint that is
 * farthest in the blast direction.
 */
function getBlastEdgeOrigin(
  attackerPosition: GridPosition,
  attackerSize: number,
  direction: { dx: number; dy: number }
): GridPosition {
  return {
    x: direction.dx > 0
      ? attackerPosition.x + attackerSize - 1
      : attackerPosition.x,
    y: direction.dy > 0
      ? attackerPosition.y + attackerSize - 1
      : attackerPosition.y,
  }
}
```

---

## L. Flanking Geometry for Large Tokens

### Context

Flanking in PTU involves attacking from opposite sides of a target. For 1x1 tokens, "opposite side" is straightforward. For multi-cell tokens, the flanking geometry considers the token's extended footprint.

**PTU Flanking Rule (simplified)**: Two attackers flank a target if they are on opposite sides. The precise rule varies by table, but the common interpretation is: the attackers' positions, when connected by a line through the target, create an angle close to 180 degrees.

### Design: Multi-Cell Flanking Check

For multi-cell targets, flanking is checked using the nearest cells of each attacker to the target footprint:

```typescript
/**
 * Check if two attackers are flanking a multi-cell target.
 *
 * Two combatants flank a target if their nearest occupied cells
 * to the target are on roughly opposite sides (within 45 degrees
 * of a straight line through the target's center).
 *
 * @param attackerA - First attacker footprint
 * @param attackerB - Second attacker footprint
 * @param target - Target footprint (may be multi-cell)
 * @returns true if the attackers are flanking the target
 */
function isFlankingTarget(
  attackerA: TokenFootprint,
  attackerB: TokenFootprint,
  target: TokenFootprint
): boolean {
  // Find nearest cells from each attacker to the target
  const pairA = closestCellPair(attackerA, target)
  const pairB = closestCellPair(attackerB, target)

  // Both attackers must be adjacent (melee range) to the target
  const distA = ptuDistanceTokens(attackerA, target)
  const distB = ptuDistanceTokens(attackerB, target)
  if (distA > 1 || distB > 1) return false

  // Calculate the center of the target footprint
  const targetCenterX = target.position.x + (target.size - 1) / 2
  const targetCenterY = target.position.y + (target.size - 1) / 2

  // Calculate angles from target center to each attacker's nearest cell
  const angleA = Math.atan2(
    pairA.from.y - targetCenterY,
    pairA.from.x - targetCenterX
  )
  const angleB = Math.atan2(
    pairB.from.y - targetCenterY,
    pairB.from.x - targetCenterX
  )

  // Calculate the absolute angle difference
  let angleDiff = Math.abs(angleA - angleB)
  if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff

  // Flanking requires roughly opposite sides (135-225 degrees = PI +/- PI/4)
  return angleDiff >= (3 * Math.PI / 4) // 135 degrees
}
```

**Note**: Flanking is not currently implemented in the app's combat system (it would be part of a future accuracy modifier feature). This function is provided as the specification for when flanking is implemented. It should be placed in `useRangeParser.ts` alongside the other spatial geometry functions.

---

## M. Measurement from Nearest Edge

### File: `app/stores/measurement.ts` and `app/composables/useRangeParser.ts`

**Current state**: The measurement tools (distance, burst, cone, line, blast) measure from and to single cells. When measuring distance between two tokens, the system should use the nearest edge (already handled by `ptuDistanceTokens()`).

**Burst/Cone/Line origin from multi-cell token**: When the GM uses a measurement tool from a selected multi-cell token, the origin should be the nearest edge cell of the token toward the measurement direction, not the token's origin cell.

**Design**: The measurement store's `startMeasurement()` takes a `GridPosition`. When a multi-cell token is selected, the caller should pass the token's center or let the measurement tool calculate the effective origin based on direction.

**For distance measurement**: Already handled by `ptuDistanceTokens()` if both endpoints are token footprints. The UI needs to:
1. Detect if the start/end positions are occupied by multi-cell tokens
2. Use `ptuDistanceTokens()` for the distance calculation instead of `ptuDiagonalDistance()`

**For AoE measurement (burst/cone/line/blast)**: The AoE origin is the clicked cell. No change needed for the AoE shape calculation. The only change is visual: if the origin is within a multi-cell token's footprint, the measurement origin should snap to the nearest edge of that footprint for visual clarity.

### Implementation in `app/stores/measurement.ts`:

```typescript
/**
 * Start measurement from a position, optionally accounting for a
 * multi-cell token at the origin.
 *
 * When tokenSize > 1, the measurement origin is adjusted to the
 * nearest edge cell of the token toward the measurement direction
 * (updated dynamically as the mouse moves).
 */
startMeasurement(
  position: GridPosition,
  tokenOrigin?: GridPosition,
  tokenSize?: number
) {
  this.startPosition = position
  this.tokenOrigin = tokenOrigin ?? null
  this.tokenSize = tokenSize ?? 1
  this.isActive = true
}
```

**Distance display**: When measuring distance and the start/end are multi-cell tokens, the distance display should show the edge-to-edge distance (from `ptuDistanceTokens`), not the origin-to-origin distance. This requires the measurement store to track token sizes at both endpoints.

**Burst targeting display**: When a burst AoE is centered on a cell occupied by a multi-cell target, the "hit" determination should use `isTargetHitByAoE()` (section K). The measurement overlay could highlight the target's full footprint in a different color to show it is affected.

---

## P2 Summary

| Feature | File | Change Type |
|---------|------|-------------|
| AoE hit detection for multi-cell targets | useRangeParser.ts | New `isTargetHitByAoE()` function |
| Close Blast origin from multi-cell attacker | useRangeParser.ts | New `getBlastEdgeOrigin()` function |
| Flanking geometry for large tokens | useRangeParser.ts | New `isFlankingTarget()` function (spec only) |
| Measurement edge-to-edge distance | measurement.ts | Track token sizes, use `ptuDistanceTokens()` |
| Burst targeting visual for large targets | useGridRendering.ts | Highlight full footprint when AoE hits large target |

P2 features are largely additive (new functions) rather than modifications to existing code. The core `getAffectedCells()` and `ptuDistanceTokens()` functions remain unchanged; the new functions compose on top of them.
