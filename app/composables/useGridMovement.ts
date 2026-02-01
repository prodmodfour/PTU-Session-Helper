import type { GridPosition, Combatant } from '~/types'
import { useTerrainStore } from '~/stores/terrain'

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

  /**
   * Calculate distance between two grid positions using PTU diagonal rules.
   * Diagonals alternate: 1m, 2m, 1m, 2m...
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
   * Check if a move is valid
   */
  const isValidMove = (
    fromPos: GridPosition,
    toPos: GridPosition,
    combatantId: string,
    gridWidth: number,
    gridHeight: number
  ): { valid: boolean; distance: number; blocked: boolean } => {
    const speed = getSpeed(combatantId)
    const distance = calculateMoveDistance(fromPos, toPos)
    const blockedCells = getBlockedCells(combatantId)
    const isBlocked = blockedCells.some(b => b.x === toPos.x && b.y === toPos.y)
    const inBounds = toPos.x >= 0 && toPos.x < gridWidth && toPos.y >= 0 && toPos.y < gridHeight

    return {
      valid: distance > 0 && distance <= speed && !isBlocked && inBounds,
      distance,
      blocked: isBlocked
    }
  }

  return {
    calculateMoveDistance,
    getSpeed,
    getBlockedCells,
    getTerrainCostAt,
    isValidMove,
    DEFAULT_MOVEMENT_SPEED
  }
}
