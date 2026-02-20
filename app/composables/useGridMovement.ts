import type { GridPosition, Combatant, Pokemon } from '~/types'
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
  getCombatant?: (combatantId: string) => Combatant | undefined
}

const DEFAULT_MOVEMENT_SPEED = 5

/**
 * Check whether a combatant has Swim capability (swim speed > 0).
 * Pokemon have capabilities.swim; humans default to 0 (no swim).
 */
function combatantCanSwim(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.swim ?? 0) > 0
  }
  return false
}

/**
 * Check whether a combatant has Burrow capability (burrow speed > 0).
 * Pokemon have capabilities.burrow; humans default to 0 (no burrow).
 */
function combatantCanBurrow(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.burrow ?? 0) > 0
  }
  return false
}

/**
 * Get the appropriate movement speed for a combatant based on terrain context.
 * Returns Swim speed for water terrain, Burrow speed for earth terrain,
 * and Overland speed for all other terrain types.
 */
function getTerrainAwareSpeed(combatant: Combatant, terrainType: string): number {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    const caps = pokemon.capabilities
    if (!caps) return DEFAULT_MOVEMENT_SPEED

    if (terrainType === 'water' && caps.swim > 0) {
      return caps.swim
    }
    if (terrainType === 'earth' && caps.burrow > 0) {
      return caps.burrow
    }
    return caps.overland || DEFAULT_MOVEMENT_SPEED
  }

  // Human characters use default (no capabilities interface yet)
  return DEFAULT_MOVEMENT_SPEED
}

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
   * Look up a combatant by ID via the provided callback.
   */
  const findCombatant = (combatantId: string): Combatant | undefined => {
    if (options.getCombatant) {
      return options.getCombatant(combatantId)
    }
    return undefined
  }

  /**
   * Get movement speed for a combatant, considering:
   * 1. Terrain-aware speed selection (Swim for water, Burrow for earth, Overland default)
   * 2. Movement-modifying conditions (Stuck, Slowed)
   * 3. Combat stage speed modifier
   * 4. Sprint maneuver (+50%)
   */
  const getSpeed = (combatantId: string): number => {
    const combatant = findCombatant(combatantId)

    // Base speed: use callback if provided, otherwise derive from combatant
    let baseSpeed: number
    if (options.getMovementSpeed) {
      baseSpeed = options.getMovementSpeed(combatantId)
    } else if (combatant) {
      // Select speed based on terrain at combatant's current position
      const token = options.tokens.value.find(t => t.combatantId === combatantId)
      if (token && terrainStore.terrainCount > 0) {
        const terrainType = terrainStore.getTerrainAt(token.position.x, token.position.y)
        baseSpeed = getTerrainAwareSpeed(combatant, terrainType)
      } else if (combatant.type === 'pokemon') {
        const pokemon = combatant.entity as Pokemon
        baseSpeed = pokemon.capabilities?.overland || DEFAULT_MOVEMENT_SPEED
      } else {
        baseSpeed = DEFAULT_MOVEMENT_SPEED
      }
    } else {
      baseSpeed = DEFAULT_MOVEMENT_SPEED
    }

    // Apply movement modifiers from combat state
    if (combatant) {
      baseSpeed = applyMovementModifiers(combatant, baseSpeed)
    }

    return baseSpeed
  }

  /**
   * Apply movement-modifying conditions and combat stage effects to base speed.
   *
   * PTU Rules:
   * - Stuck: movement actions cost double (halve effective speed)
   * - Slowed: reduce all movement speeds by half
   * - Speed CS: stage multiplier applied to movement speed
   * - Sprint (tempCondition): +50% movement speed for the turn
   */
  const applyMovementModifiers = (combatant: Combatant, speed: number): number => {
    let modifiedSpeed = speed
    const conditions = combatant.entity.statusConditions ?? []
    const tempConditions = combatant.tempConditions ?? []

    // Stuck: movement costs double -> effectively halve speed
    if (conditions.includes('Stuck')) {
      modifiedSpeed = Math.floor(modifiedSpeed / 2)
    }

    // Slowed: reduce all movement speeds by half
    if (conditions.includes('Slowed')) {
      modifiedSpeed = Math.floor(modifiedSpeed / 2)
    }

    // Speed Combat Stage modifier (-6 to +6)
    const speedStage = combatant.entity.stageModifiers?.speed ?? 0
    if (speedStage !== 0) {
      const stageMultiplier = getSpeedStageMultiplier(speedStage)
      modifiedSpeed = Math.floor(modifiedSpeed * stageMultiplier)
    }

    // Sprint: +50% movement speed for the turn (tracked as tempCondition)
    if (tempConditions.includes('Sprint')) {
      modifiedSpeed = Math.floor(modifiedSpeed * 1.5)
    }

    // Minimum speed is 1 (can always move at least 1 cell unless at 0)
    return Math.max(modifiedSpeed, speed > 0 ? 1 : 0)
  }

  /**
   * Get speed combat stage multiplier.
   * PTU combat stages: -6 to +6 with specific multipliers.
   */
  const getSpeedStageMultiplier = (stage: number): number => {
    const clamped = Math.max(-6, Math.min(6, stage))
    const multipliers: Record<number, number> = {
      [-6]: 0.4, [-5]: 0.5, [-4]: 0.6, [-3]: 0.7,
      [-2]: 0.8, [-1]: 0.9, [0]: 1.0,
      [1]: 1.2, [2]: 1.4, [3]: 1.6,
      [4]: 1.8, [5]: 2.0, [6]: 2.2
    }
    return multipliers[clamped] ?? 1.0
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
   * Get terrain cost at a position for a specific combatant.
   * Checks the combatant's Swim and Burrow capabilities to determine
   * whether water/earth terrain is passable.
   */
  const getTerrainCostForCombatant = (x: number, y: number, combatantId: string): number => {
    const combatant = findCombatant(combatantId)
    const canSwim = combatant ? combatantCanSwim(combatant) : false
    const canBurrow = combatant ? combatantCanBurrow(combatant) : false
    return terrainStore.getMovementCost(x, y, canSwim, canBurrow)
  }

  /**
   * Get terrain cost at a position (without combatant context).
   * Used by rendering code that needs a generic (x, y) => cost function.
   * Falls back to no-swim, no-burrow for safety.
   */
  const getTerrainCostAt = (x: number, y: number): number => {
    return terrainStore.getMovementCost(x, y, false, false)
  }

  /**
   * Get a combatant-aware terrain cost getter function, or undefined if no terrain is active.
   * Returns undefined when there's no terrain to avoid unnecessary pathfinding overhead.
   * The returned function is bound to the specific combatant's capabilities.
   */
  const getTerrainCostGetter = (combatantId?: string): TerrainCostGetter | undefined => {
    if (terrainStore.terrainCount === 0) return undefined
    if (combatantId) {
      return (x: number, y: number) => getTerrainCostForCombatant(x, y, combatantId)
    }
    return getTerrainCostAt
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
    const terrainCostGetter = getTerrainCostGetter(combatantId)
    return calculatePathCost(from, to, blockedCells, terrainCostGetter)
  }

  /**
   * Check if a move is valid, accounting for terrain costs and combatant capabilities.
   *
   * Uses terrain-aware pathfinding (A*) when terrain is present on the grid.
   * Falls back to geometric distance when no terrain exists (for performance).
   *
   * - Slow/difficult terrain costs 2 movement per cell
   * - Blocking terrain prevents movement through it
   * - Water terrain blocks non-swimming combatants
   * - Earth terrain blocks non-burrowing combatants
   * - Movement conditions (Stuck, Slowed) reduce effective speed
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

    const terrainCostGetter = getTerrainCostGetter(combatantId)

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
    getTerrainCostForCombatant,
    getTerrainCostGetter,
    isValidMove,
    DEFAULT_MOVEMENT_SPEED
  }
}
