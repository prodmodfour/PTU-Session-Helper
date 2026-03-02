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
import { ptuDiagonalDistance } from '~/utils/gridDistance'

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
 * Uses PTU diagonal distance to calculate movement cost.
 * Excludes the attacker's cell and the target's cell from valid interception squares
 * (the interceptor must step INTO the path, not stand on the endpoints).
 *
 * @param interceptorPos - The interceptor's current grid position
 * @param interceptorSpeed - The interceptor's movement speed in meters
 * @param attackLine - All cells on the line of attack (from getLineOfAttackCells)
 * @returns Whether the interceptor can reach the line, the best (closest) square, and distance
 */
export function canReachLineOfAttack(
  interceptorPos: GridPosition,
  interceptorSpeed: number,
  attackLine: GridPosition[]
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
    const distance = ptuDiagonalDistance(
      cell.x - interceptorPos.x,
      cell.y - interceptorPos.y
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
 * @param interceptorPos - The interceptor's current grid position
 * @param interceptorSpeed - The interceptor's movement speed in meters
 * @param attackLine - All cells on the line of attack
 * @returns Array of reachable cells with distances, sorted by distance
 */
export function getReachableInterceptionSquares(
  interceptorPos: GridPosition,
  interceptorSpeed: number,
  attackLine: GridPosition[]
): Array<{ cell: GridPosition; distance: number }> {
  if (attackLine.length < 3) return []

  // Exclude first (attacker) and last (target) cells
  const intermediateCells = attackLine.slice(1, -1)

  const reachable: Array<{ cell: GridPosition; distance: number }> = []

  for (const cell of intermediateCells) {
    const distance = ptuDiagonalDistance(
      cell.x - interceptorPos.x,
      cell.y - interceptorPos.y
    )

    if (distance <= interceptorSpeed) {
      reachable.push({ cell, distance })
    }
  }

  // Sort by distance (closest first)
  return reachable.sort((a, b) => a.distance - b.distance)
}
