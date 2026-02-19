import type { GridPosition, Combatant } from '~/types'
import { useTerrainStore } from '~/stores/terrain'
import { useRangeParser, type TerrainCostGetter } from '~/composables/useRangeParser'

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
}

interface UseGridMovementOptions {
  tokens: Ref<TokenData[]>
  getMovementSpeed?: (combatantId: string) => number
}

const DEFAULT_MOVEMENT_SPEED = 5

export function useGridMovement(options: UseGridMovementOptions) {
  const terrainStore = useTerrainStore()
  const { calculatePathCost, getMovementRangeCells } = useRangeParser()

  /**
   * Calculate distance between two grid positions using PTU diagonal rules.
   * Diagonals alternate: 1m, 2m, 1m, 2m...
   *
   * Note: This is the geometric (no-terrain) distance. For terrain-aware cost,
   * use calculateTerrainAwarePathCost instead.
   */
  const calculateMoveDistance = (from: GridPosition, to: GridPosition): number => {
    const dx = Math.abs(to.x - from.x)
    const dy = Math.abs(to.y - from.y)
    const diagonals = Math.min(dx, dy)
    const straights = Math.abs(dx - dy)
    // Diagonal cost: 1 + 2 + 1 + 2... = diagonals + floor(diagonals / 2)
    const diagonalCost = diagonals + Math.floor(diagonals / 2)
    return diagonalCost + straights
  }

  /**
   * Get movement speed for a combatant
   */
  const getSpeed = (combatantId: string): number => {
    if (options.getMovementSpeed) {
      return options.getMovementSpeed(combatantId)
    }
    return DEFAULT_MOVEMENT_SPEED
  }

  /**
   * Get blocked cells (cells occupied by other tokens)
   */
  const getBlockedCells = (excludeCombatantId?: string): GridPosition[] => {
    const blocked: GridPosition[] = []
    options.tokens.value.forEach(token => {
      if (token.combatantId === excludeCombatantId) return
      // Add all cells occupied by this token
      for (let dx = 0; dx < token.size; dx++) {
        for (let dy = 0; dy < token.size; dy++) {
          blocked.push({
            x: token.position.x + dx,
            y: token.position.y + dy
          })
        }
      }
    })
    return blocked
  }

  /**
   * Get terrain cost at a position for movement calculations
   */
  const getTerrainCostAt = (x: number, y: number): number => {
    return terrainStore.getMovementCost(x, y, false) // TODO: Pass canSwim based on combatant
  }

  /**
   * Get the terrain cost getter function, or undefined if no terrain is active.
   * Returns undefined when there's no terrain to avoid unnecessary pathfinding overhead.
   */
  const getTerrainCostGetter = (): TerrainCostGetter | undefined => {
    return terrainStore.terrainCount > 0 ? getTerrainCostAt : undefined
  }

  /**
   * Calculate the terrain-aware path cost between two positions.
   * Uses A* pathfinding with PTU diagonal rules and terrain costs.
   * Returns the cost and path, or null if no valid path exists.
   */
  const calculateTerrainAwarePathCost = (
    from: GridPosition,
    to: GridPosition,
    combatantId: string
  ): { cost: number; path: GridPosition[] } | null => {
    const blockedCells = getBlockedCells(combatantId)
    const terrainCostGetter = getTerrainCostGetter()
    return calculatePathCost(from, to, blockedCells, terrainCostGetter)
  }

  /**
   * Check if a move is valid, accounting for terrain costs.
   *
   * Uses terrain-aware pathfinding (A*) when terrain is present on the grid.
   * Falls back to geometric distance when no terrain exists (for performance).
   *
   * - Slow/difficult terrain costs 2 movement per cell
   * - Blocking terrain prevents movement through it
   * - Water terrain blocks non-swimming combatants
   */
  const isValidMove = (
    fromPos: GridPosition,
    toPos: GridPosition,
    combatantId: string,
    gridWidth: number,
    gridHeight: number
  ): { valid: boolean; distance: number; blocked: boolean } => {
    const speed = getSpeed(combatantId)
    const blockedCells = getBlockedCells(combatantId)
    const isBlocked = blockedCells.some(b => b.x === toPos.x && b.y === toPos.y)
    const inBounds = toPos.x >= 0 && toPos.x < gridWidth && toPos.y >= 0 && toPos.y < gridHeight

    if (isBlocked || !inBounds) {
      const geometricDistance = calculateMoveDistance(fromPos, toPos)
      return {
        valid: false,
        distance: geometricDistance,
        blocked: isBlocked
      }
    }

    const terrainCostGetter = getTerrainCostGetter()

    if (terrainCostGetter) {
      // Terrain-aware: use A* pathfinding
      const pathResult = calculatePathCost(fromPos, toPos, blockedCells, terrainCostGetter)
      if (!pathResult) {
        // No valid path (terrain blocks all routes)
        const geometricDistance = calculateMoveDistance(fromPos, toPos)
        return {
          valid: false,
          distance: geometricDistance,
          blocked: true // Effectively blocked by terrain
        }
      }
      return {
        valid: pathResult.cost > 0 && pathResult.cost <= speed,
        distance: pathResult.cost,
        blocked: false
      }
    }

    // No terrain: fast geometric check
    const distance = calculateMoveDistance(fromPos, toPos)
    return {
      valid: distance > 0 && distance <= speed,
      distance,
      blocked: false
    }
  }

  return {
    calculateMoveDistance,
    calculateTerrainAwarePathCost,
    getSpeed,
    getBlockedCells,
    getTerrainCostAt,
    getTerrainCostGetter,
    isValidMove,
    DEFAULT_MOVEMENT_SPEED
  }
}
