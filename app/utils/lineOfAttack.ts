/**
 * Line-of-Attack Utility for Intercept Ranged (R117)
 *
 * Uses Bresenham's line algorithm to determine which grid cells
 * a ranged attack passes through between attacker and target.
 * Used to determine valid interception squares.
 *
 * PTU p.242: "A Ranged X-Target attack passes within your movement range."
 * The interceptor must be able to reach a cell on the line between
 * attacker and target within their movement range.
 */

import type { GridPosition } from '~/types/spatial'
import { ptuDistanceTokensBBox } from '~/utils/gridDistance'

/**
 * Compute the center cell of a token footprint (floored for even-sized tokens).
 * For 1x1 tokens, returns the position unchanged.
 * For 2x2 tokens at (0,0), returns (0,0) -- floor of (0.5,0.5).
 * For 3x3 tokens at (0,0), returns (1,1) -- center cell.
 */
function tokenCenter(position: GridPosition, size: number): GridPosition {
  if (size <= 1) return position
  const offset = Math.floor((size - 1) / 2)
  return { x: position.x + offset, y: position.y + offset }
}

/**
 * Get all grid cells on the line of attack between two tokens,
 * drawn from the center of each token's footprint.
 *
 * For multi-tile tokens, the attack line originates from the center
 * of the attacker's footprint to the center of the target's footprint.
 *
 * @param attackerPos - Attacker's anchor (top-left) position
 * @param attackerSize - Attacker's token footprint size
 * @param targetPos - Target's anchor (top-left) position
 * @param targetSize - Target's token footprint size
 * @returns Array of grid positions along the line
 */
export function getLineOfAttackCellsMultiTile(
  attackerPos: GridPosition,
  attackerSize: number,
  targetPos: GridPosition,
  targetSize: number
): GridPosition[] {
  return getLineOfAttackCells(
    tokenCenter(attackerPos, attackerSize),
    tokenCenter(targetPos, targetSize)
  )
}

/**
 * Get all grid cells on the line between two positions using Bresenham's algorithm.
 * Returns cells in order from `from` to `to`, inclusive of both endpoints.
 *
 * @param from - Starting position (attacker)
 * @param to - Ending position (target)
 * @returns Array of grid positions along the line
 */
export function getLineOfAttackCells(
  from: GridPosition,
  to: GridPosition
): GridPosition[] {
  const cells: GridPosition[] = []

  let x0 = from.x
  let y0 = from.y
  const x1 = to.x
  const y1 = to.y

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  while (true) {
    cells.push({ x: x0, y: y0 })

    if (x0 === x1 && y0 === y1) break

    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }

  return cells
}

/**
 * Check if a combatant can reach any cell on the line of attack
 * within their movement range.
 *
 * Uses PTU bbox distance (edge-to-edge) for multi-tile token support.
 * Excludes the attacker's cell and the target's cell from valid interception squares
 * (the interceptor must step INTO the path, not stand on the endpoints).
 *
 * @param interceptorPos - The interceptor's current grid position
 * @param interceptorSpeed - The interceptor's movement speed in meters
 * @param attackLine - All cells on the line of attack (from getLineOfAttackCells)
 * @param interceptorSize - Token footprint size (default 1)
 * @returns Whether the interceptor can reach the line, the best (closest) square, and distance
 */
export function canReachLineOfAttack(
  interceptorPos: GridPosition,
  interceptorSpeed: number,
  attackLine: GridPosition[],
  interceptorSize: number = 1
): { canReach: boolean; bestSquare: GridPosition | null; distanceToSquare: number } {
  if (attackLine.length < 3) {
    // Line too short (only attacker + target, no intermediate cells)
    return { canReach: false, bestSquare: null, distanceToSquare: Infinity }
  }

  // Exclude first (attacker) and last (target) cells
  const intermediateCells = attackLine.slice(1, -1)

  let bestSquare: GridPosition | null = null
  let bestDistance = Infinity

  for (const cell of intermediateCells) {
    const distance = ptuDistanceTokensBBox(
      { position: interceptorPos, size: interceptorSize },
      { position: cell, size: 1 }
    )

    if (distance <= interceptorSpeed && distance < bestDistance) {
      bestDistance = distance
      bestSquare = cell
    }
  }

  return {
    canReach: bestSquare !== null,
    bestSquare,
    distanceToSquare: bestSquare ? bestDistance : Infinity
  }
}

/**
 * Get all reachable interception squares on the line of attack.
 * Returns all intermediate cells within the interceptor's movement range,
 * sorted by distance (closest first).
 *
 * Uses PTU bbox distance (edge-to-edge) for multi-tile token support.
 *
 * @param interceptorPos - The interceptor's current grid position
 * @param interceptorSpeed - The interceptor's movement speed in meters
 * @param attackLine - All cells on the line of attack
 * @param interceptorSize - Token footprint size (default 1)
 * @returns Array of reachable cells with distances, sorted by distance
 */
export function getReachableInterceptionSquares(
  interceptorPos: GridPosition,
  interceptorSpeed: number,
  attackLine: GridPosition[],
  interceptorSize: number = 1
): Array<{ cell: GridPosition; distance: number }> {
  if (attackLine.length < 3) return []

  // Exclude first (attacker) and last (target) cells
  const intermediateCells = attackLine.slice(1, -1)

  const reachable: Array<{ cell: GridPosition; distance: number }> = []

  for (const cell of intermediateCells) {
    const distance = ptuDistanceTokensBBox(
      { position: interceptorPos, size: interceptorSize },
      { position: cell, size: 1 }
    )

    if (distance <= interceptorSpeed) {
      reachable.push({ cell, distance })
    }
  }

  // Sort by distance (closest first)
  return reachable.sort((a, b) => a.distance - b.distance)
}
