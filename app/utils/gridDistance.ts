/**
 * PTU grid distance utilities.
 *
 * PTU uses alternating diagonal movement: first diagonal costs 1m,
 * second costs 2m, third costs 1m, etc.  The closed-form formula
 * for total diagonal cost is: diagonals + floor(diagonals / 2).
 */

/**
 * Calculate the PTU diagonal distance between two axis deltas.
 *
 * Implements the PTU alternating diagonal movement rule:
 *   diagonals + floor(diagonals / 2) + straights
 *
 * @param dx - Horizontal distance (may be negative; absolute value is used)
 * @param dy - Vertical distance (may be negative; absolute value is used)
 * @returns Movement cost in meters (cells)
 */
export function ptuDiagonalDistance(dx: number, dy: number): number {
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  const diagonals = Math.min(absDx, absDy)
  const straights = Math.abs(absDx - absDy)
  return diagonals + Math.floor(diagonals / 2) + straights
}

/**
 * Calculate the maximum number of purely diagonal cells reachable within
 * a given meter budget using PTU's alternating diagonal rule (1-2-1-2).
 *
 * Used by Line attacks going diagonally (decree-009): a Line X attack
 * covers fewer cells diagonally because each cell costs alternating 1-2m.
 *
 * Examples:
 *   budget=2 → 1 cell  (cost 1m, next step would total 3m)
 *   budget=4 → 3 cells (1+2+1=4m)
 *   budget=6 → 4 cells (1+2+1+2=6m)
 *   budget=8 → 5 cells (1+2+1+2+1=7m, next step would total 9m)
 *
 * @param budget - Maximum distance in meters
 * @returns Number of diagonal cells reachable
 */
export function maxDiagonalCells(budget: number): number {
  let cells = 0
  let cost = 0
  while (true) {
    const stepCost = (cells % 2 === 0) ? 1 : 2
    if (cost + stepCost > budget) break
    cost += stepCost
    cells++
  }
  return cells
}
