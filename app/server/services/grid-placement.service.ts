/**
 * Grid Placement Service
 * Shared logic for auto-placing combatant tokens on the encounter grid.
 * Used by combatants.post, wild-spawn.post, and from-scene.post.
 */

export type Side = 'players' | 'allies' | 'enemies'

export interface Position {
  x: number
  y: number
}

interface Combatant {
  position?: Position | null
  tokenSize?: number
}

const SIDE_POSITIONS: Record<Side, { startX: number; endX: number }> = {
  players: { startX: 1, endX: 4 },
  allies: { startX: 5, endX: 8 },
  enemies: { startX: -5, endX: -1 } // negative = relative to gridWidth, resolved at call time
}

/**
 * Map PTU size capability to grid token size (in cells).
 */
export function sizeToTokenSize(size: string | undefined): number {
  switch (size) {
    case 'Small':
    case 'Medium':
      return 1
    case 'Large':
      return 2
    case 'Huge':
      return 3
    case 'Gigantic':
      return 4
    default:
      return 1
  }
}

/**
 * Build a set of all occupied grid cells from existing combatants.
 * Each multi-cell token marks all cells it covers.
 */
export function buildOccupiedCellsSet(combatants: Combatant[]): Set<string> {
  const occupied = new Set<string>()
  for (const c of combatants) {
    if (!c.position) continue
    const size = c.tokenSize || 1
    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        occupied.add(`${c.position.x + dx},${c.position.y + dy}`)
      }
    }
  }
  return occupied
}

/**
 * Check if a token of the given size can fit at (x, y) without overlapping
 * occupied cells or exceeding grid bounds.
 */
function canFit(
  x: number,
  y: number,
  size: number,
  gridWidth: number,
  gridHeight: number,
  occupiedCells: Set<string>
): boolean {
  if (x + size > gridWidth || y + size > gridHeight) return false
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      if (occupiedCells.has(`${x + dx},${y + dy}`)) return false
    }
  }
  return true
}

/**
 * Mark cells as occupied after placing a token.
 */
function markOccupied(occupiedCells: Set<string>, x: number, y: number, size: number): void {
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      occupiedCells.add(`${x + dx},${y + dy}`)
    }
  }
}

/**
 * Find the next available grid position for a token on the given side.
 * Tries the side's designated columns first, then falls back to anywhere on the grid.
 * Mutates `occupiedCells` to mark the placed position as occupied, so successive
 * calls correctly avoid already-placed tokens.
 */
export function findPlacementPosition(
  occupiedCells: Set<string>,
  side: string,
  tokenSize: number,
  gridWidth: number,
  gridHeight: number
): Position {
  const sideKey = (side as Side) in SIDE_POSITIONS ? side as Side : 'enemies'
  const raw = SIDE_POSITIONS[sideKey]

  // Resolve relative positions (enemies use negative offsets from gridWidth)
  const sideConfig = {
    startX: raw.startX < 0 ? gridWidth + raw.startX : raw.startX,
    endX: raw.endX < 0 ? gridWidth + raw.endX : raw.endX
  }

  let position: Position = { x: sideConfig.startX, y: 1 }
  let found = false

  // Pass 1: try within the side's designated area
  for (let y = 1; y < gridHeight - tokenSize + 1 && !found; y++) {
    for (let x = sideConfig.startX; x <= sideConfig.endX - tokenSize + 1 && !found; x++) {
      if (canFit(x, y, tokenSize, gridWidth, gridHeight, occupiedCells)) {
        position = { x, y }
        found = true
      }
    }
  }

  // Pass 2: fallback to anywhere on the grid
  if (!found) {
    for (let y = 1; y < gridHeight - tokenSize + 1 && !found; y++) {
      for (let x = 1; x < gridWidth - tokenSize + 1 && !found; x++) {
        if (canFit(x, y, tokenSize, gridWidth, gridHeight, occupiedCells)) {
          position = { x, y }
          found = true
        }
      }
    }
  }

  // Mark placed cells as occupied for subsequent placements
  markOccupied(occupiedCells, position.x, position.y, tokenSize)

  return position
}
