import type { RangeType, ParsedRange, GridPosition, TerrainType } from '~/types'

// Terrain cost function type
export type TerrainCostGetter = (x: number, y: number) => number

/**
 * PTU Range Parser
 *
 * Parses move range strings into structured data for VTT calculations.
 *
 * PTU Range formats:
 * - "Melee" or "Melee, 1 Target" - Adjacent (range 1)
 * - "6" or "6, 1 Target" - Ranged attack at 6 meters
 * - "Burst 2" - 2-cell burst centered on a point within range
 * - "Cone 2" - 2-cell cone from user
 * - "Close Blast 2" - 2x2 square adjacent to user
 * - "Line 4" - 4-cell line from user
 * - "Ranged Blast 2" - 2x2 blast at range (needs separate range)
 * - "Self" - Affects only the user
 * - "Field" - Affects entire battlefield
 * - "Cardinally Adjacent" - Only orthogonal (not diagonal) adjacent cells
 */

export interface RangeParseResult {
  type: RangeType
  range: number        // Max range in cells (meters)
  aoeSize?: number     // Size of AoE if applicable
  targetCount?: number // Number of targets (if specified)
  width?: number       // Width for line attacks
  minRange?: number    // Minimum range (for ranged only moves)
  special?: string     // Any special notes
}

export function useRangeParser() {
  /**
   * Parse a PTU range string into structured data
   */
  function parseRange(rangeString: string): RangeParseResult {
    if (!rangeString) {
      return { type: 'melee', range: 1 }
    }

    const str = rangeString.trim()
    const lower = str.toLowerCase()

    // Self-targeting
    if (lower === 'self' || lower.startsWith('self,')) {
      return { type: 'self', range: 0 }
    }

    // Field effect (entire battlefield)
    if (lower === 'field' || lower.includes('field')) {
      return { type: 'field', range: Infinity }
    }

    // Melee attacks
    if (lower === 'melee' || lower.startsWith('melee,')) {
      const targets = extractTargetCount(str)
      return { type: 'melee', range: 1, targetCount: targets }
    }

    // Cardinally adjacent
    if (lower.includes('cardinally adjacent')) {
      return { type: 'cardinally-adjacent', range: 1 }
    }

    // Burst (centered on target or self)
    const burstMatch = str.match(/burst\s*(\d+)/i)
    if (burstMatch) {
      const aoeSize = parseInt(burstMatch[1], 10)
      const baseRange = extractBaseRange(str) || 6 // Default burst range
      return { type: 'burst', range: baseRange, aoeSize }
    }

    // Cone attacks
    const coneMatch = str.match(/cone\s*(\d+)/i)
    if (coneMatch) {
      const aoeSize = parseInt(coneMatch[1], 10)
      return { type: 'cone', range: aoeSize, aoeSize }
    }

    // Close Blast (adjacent square)
    const closeBlastMatch = str.match(/close\s*blast\s*(\d+)/i)
    if (closeBlastMatch) {
      const aoeSize = parseInt(closeBlastMatch[1], 10)
      return { type: 'close-blast', range: 1, aoeSize }
    }

    // Ranged Blast (blast at range)
    const rangedBlastMatch = str.match(/(?:ranged\s*)?blast\s*(\d+)/i)
    if (rangedBlastMatch && !closeBlastMatch) {
      const aoeSize = parseInt(rangedBlastMatch[1], 10)
      const baseRange = extractBaseRange(str) || 6
      return { type: 'ranged-blast', range: baseRange, aoeSize }
    }

    // Line attacks
    const lineMatch = str.match(/line\s*(\d+)/i)
    if (lineMatch) {
      const aoeSize = parseInt(lineMatch[1], 10)
      const width = extractLineWidth(str)
      return { type: 'line', range: aoeSize, aoeSize, width }
    }

    // Simple ranged (just a number)
    const simpleRangeMatch = str.match(/^(\d+)(?:\s*,|\s*$)/i)
    if (simpleRangeMatch) {
      const range = parseInt(simpleRangeMatch[1], 10)
      const targets = extractTargetCount(str)
      return { type: 'ranged', range, targetCount: targets }
    }

    // Numeric range somewhere in string
    const numMatch = str.match(/(\d+)/i)
    if (numMatch) {
      const range = parseInt(numMatch[1], 10)
      return { type: 'ranged', range }
    }

    // Default to melee if unparseable
    return { type: 'melee', range: 1, special: str }
  }

  /**
   * Extract target count from range string
   */
  function extractTargetCount(str: string): number | undefined {
    const targetMatch = str.match(/(\d+)\s*target/i)
    return targetMatch ? parseInt(targetMatch[1], 10) : undefined
  }

  /**
   * Extract base range from compound range strings
   */
  function extractBaseRange(str: string): number | undefined {
    // Look for standalone number before AoE type
    const match = str.match(/^(\d+)[,\s]/i)
    return match ? parseInt(match[1], 10) : undefined
  }

  /**
   * Extract line width for wide line attacks
   */
  function extractLineWidth(str: string): number {
    const widthMatch = str.match(/(\d+)\s*wide/i)
    return widthMatch ? parseInt(widthMatch[1], 10) : 1
  }

  /**
   * Check if there is an unobstructed line of sight between two grid positions.
   * Uses Bresenham's line algorithm to trace cells along the path.
   *
   * PTU Rule: Blocking terrain blocks both movement AND targeting/line of sight.
   * Cells occupied by the attacker or the target are excluded from the check.
   *
   * @param from - Origin position (attacker)
   * @param to - Target position
   * @param isBlockingFn - Function that returns true if a cell blocks line of sight
   */
  function hasLineOfSight(
    from: GridPosition,
    to: GridPosition,
    isBlockingFn: (x: number, y: number) => boolean
  ): boolean {
    // Same cell always has LoS
    if (from.x === to.x && from.y === to.y) return true

    // Bresenham's line from center-of-cell to center-of-cell
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
      // Skip the origin and destination cells — only check intermediate cells
      if (!(x0 === from.x && y0 === from.y) && !(x0 === to.x && y0 === to.y)) {
        if (isBlockingFn(x0, y0)) {
          return false
        }
      }

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

    return true
  }

  /**
   * Check if a target position is within range of an attacker.
   *
   * When an isBlockingFn is provided, also checks line of sight —
   * blocking terrain between attacker and target prevents targeting
   * per PTU rules.
   */
  function isInRange(
    attacker: GridPosition,
    target: GridPosition,
    parsedRange: RangeParseResult,
    isBlockingFn?: (x: number, y: number) => boolean
  ): boolean {
    // Self only affects user
    if (parsedRange.type === 'self') {
      return attacker.x === target.x && attacker.y === target.y
    }

    // Field affects everyone
    if (parsedRange.type === 'field') {
      return true
    }

    // Calculate Chebyshev distance (PTU standard)
    const distance = Math.max(
      Math.abs(target.x - attacker.x),
      Math.abs(target.y - attacker.y)
    )

    // Cardinally adjacent - only orthogonal
    if (parsedRange.type === 'cardinally-adjacent') {
      const dx = Math.abs(target.x - attacker.x)
      const dy = Math.abs(target.y - attacker.y)
      const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
      if (!isAdjacent) return false
      // Check LoS even for adjacent (wall between adjacent cells blocks targeting)
      if (isBlockingFn) {
        return hasLineOfSight(attacker, target, isBlockingFn)
      }
      return true
    }

    // Check min range if applicable
    if (parsedRange.minRange && distance < parsedRange.minRange) {
      return false
    }

    if (distance > parsedRange.range) {
      return false
    }

    // Check line of sight if blocking function provided
    if (isBlockingFn) {
      return hasLineOfSight(attacker, target, isBlockingFn)
    }

    return true
  }

  /**
   * Get all cells that would be affected by an AoE attack
   */
  function getAffectedCells(
    origin: GridPosition,
    direction: { dx: number; dy: number },
    parsedRange: RangeParseResult
  ): GridPosition[] {
    const cells: GridPosition[] = []
    const size = parsedRange.aoeSize || 1

    switch (parsedRange.type) {
      case 'burst':
        // Burst is a square centered on origin
        for (let dx = -size; dx <= size; dx++) {
          for (let dy = -size; dy <= size; dy++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) <= size) {
              cells.push({ x: origin.x + dx, y: origin.y + dy })
            }
          }
        }
        break

      case 'cone':
        // Cone expands from origin in direction
        for (let d = 1; d <= size; d++) {
          const baseX = origin.x + direction.dx * d
          const baseY = origin.y + direction.dy * d
          const halfWidth = Math.floor(d / 2)

          if (direction.dx === 0) {
            for (let w = -halfWidth; w <= halfWidth; w++) {
              cells.push({ x: baseX + w, y: baseY })
            }
          } else if (direction.dy === 0) {
            for (let w = -halfWidth; w <= halfWidth; w++) {
              cells.push({ x: baseX, y: baseY + w })
            }
          } else {
            for (let w = -halfWidth; w <= halfWidth; w++) {
              cells.push({ x: baseX + w, y: baseY })
              cells.push({ x: baseX, y: baseY + w })
            }
          }
        }
        break

      case 'close-blast':
      case 'ranged-blast':
        // Square blast
        const startX = origin.x + direction.dx
        const startY = origin.y + direction.dy
        for (let dx = 0; dx < size; dx++) {
          for (let dy = 0; dy < size; dy++) {
            const cellX = direction.dx >= 0 ? startX + dx : startX - dx
            const cellY = direction.dy >= 0 ? startY + dy : startY - dy
            cells.push({ x: cellX, y: cellY })
          }
        }
        break

      case 'line':
        // Line from origin in direction
        const width = parsedRange.width || 1
        for (let d = 1; d <= size; d++) {
          const baseX = origin.x + direction.dx * d
          const baseY = origin.y + direction.dy * d
          cells.push({ x: baseX, y: baseY })

          // Add width
          if (width > 1) {
            const halfWidth = Math.floor(width / 2)
            for (let w = 1; w <= halfWidth; w++) {
              if (direction.dx === 0) {
                cells.push({ x: baseX - w, y: baseY })
                cells.push({ x: baseX + w, y: baseY })
              } else if (direction.dy === 0) {
                cells.push({ x: baseX, y: baseY - w })
                cells.push({ x: baseX, y: baseY + w })
              }
            }
          }
        }
        break

      case 'melee':
      case 'cardinally-adjacent':
        // Single target at position
        cells.push(origin)
        break

      default:
        cells.push(origin)
    }

    // Remove duplicates
    return cells.filter((cell, index, arr) =>
      arr.findIndex(c => c.x === cell.x && c.y === cell.y) === index
    )
  }

  /**
   * Get movement range visualization cells with terrain cost support
   *
   * Uses flood-fill algorithm to find all reachable cells within movement budget,
   * accounting for terrain movement costs and PTU diagonal rules.
   *
   * PTU Diagonal Rules: First diagonal costs 1m, second costs 2m, alternating.
   *
   * @param origin - Starting position
   * @param speed - Movement speed (movement points available)
   * @param blockedCells - Cells blocked by other tokens
   * @param getTerrainCost - Optional function to get terrain movement cost at a position
   */
  function getMovementRangeCells(
    origin: GridPosition,
    speed: number,
    blockedCells: GridPosition[] = [],
    getTerrainCost?: TerrainCostGetter
  ): GridPosition[] {
    const reachable: GridPosition[] = []
    const blockedSet = new Set(blockedCells.map(c => `${c.x},${c.y}`))

    // Cost map: stores the minimum cost to reach each cell
    // We track both cost and diagonal parity (0 = next diagonal costs 1, 1 = next costs 2)
    const costMap = new Map<string, { cost: number; diagonalParity: number }>()
    const startKey = `${origin.x},${origin.y}`
    costMap.set(startKey, { cost: 0, diagonalParity: 0 })

    // Priority queue for Dijkstra-like exploration
    // Each entry: [x, y, costToReach, diagonalParity]
    const queue: Array<[number, number, number, number]> = [[origin.x, origin.y, 0, 0]]

    // 8 directions for movement (including diagonals)
    // Mark which are diagonal moves
    const directions: Array<[number, number, boolean]> = [
      [-1, -1, true], [-1, 0, false], [-1, 1, true],
      [0, -1, false], /* origin */ [0, 1, false],
      [1, -1, true], [1, 0, false], [1, 1, true],
    ]

    while (queue.length > 0) {
      // Sort by cost (lowest first) - simple priority queue
      queue.sort((a, b) => a[2] - b[2])
      const [x, y, currentCost, currentParity] = queue.shift()!

      // Skip if we've already found a cheaper path to this cell
      const cellKey = `${x},${y}`
      const existing = costMap.get(cellKey)
      if (existing && existing.cost < currentCost) {
        continue
      }

      // Explore neighbors
      for (const [dx, dy, isDiagonal] of directions) {
        const nx = x + dx
        const ny = y + dy
        const neighborKey = `${nx},${ny}`

        // Skip if blocked by token
        if (blockedSet.has(neighborKey)) {
          continue
        }

        // Get terrain cost multiplier for the destination cell
        const terrainMultiplier = getTerrainCost ? getTerrainCost(nx, ny) : 1

        // Skip impassable terrain (Infinity cost)
        if (!isFinite(terrainMultiplier)) {
          continue
        }

        // Calculate movement cost based on PTU diagonal rules
        let baseCost: number
        let newParity: number
        if (isDiagonal) {
          // Diagonal: alternates 1, 2, 1, 2...
          baseCost = currentParity === 0 ? 1 : 2
          newParity = 1 - currentParity // Toggle parity
        } else {
          // Straight: always costs 1
          baseCost = 1
          newParity = currentParity // Parity unchanged for straight moves
        }

        const moveCost = baseCost * terrainMultiplier
        const totalCost = currentCost + moveCost

        // Skip if exceeds movement budget
        if (totalCost > speed) {
          continue
        }

        // Check if we've found a better path
        const existingNeighbor = costMap.get(neighborKey)
        if (existingNeighbor && existingNeighbor.cost <= totalCost) {
          continue
        }

        // Record this path
        costMap.set(neighborKey, { cost: totalCost, diagonalParity: newParity })

        // Add to reachable if not the origin
        if (nx !== origin.x || ny !== origin.y) {
          const existingIndex = reachable.findIndex(c => c.x === nx && c.y === ny)
          if (existingIndex === -1) {
            reachable.push({ x: nx, y: ny })
          }
        }

        // Add to queue for further exploration
        queue.push([nx, ny, totalCost, newParity])
      }
    }

    return reachable
  }

  /**
   * Calculate the minimum movement cost between two positions using PTU diagonal rules
   * Diagonals alternate: 1m, 2m, 1m, 2m...
   */
  function calculateMoveCost(from: GridPosition, to: GridPosition): number {
    const dx = Math.abs(to.x - from.x)
    const dy = Math.abs(to.y - from.y)
    const diagonals = Math.min(dx, dy)
    const straights = Math.abs(dx - dy)
    // Diagonal cost: 1 + 2 + 1 + 2... = diagonals + floor(diagonals / 2)
    const diagonalCost = diagonals + Math.floor(diagonals / 2)
    return diagonalCost + straights
  }

  /**
   * Validate if a movement is legal, accounting for terrain costs
   */
  function validateMovement(
    from: GridPosition,
    to: GridPosition,
    speed: number,
    blockedCells: GridPosition[] = [],
    getTerrainCost?: TerrainCostGetter
  ): { valid: boolean; distance: number; cost: number; reason?: string } {
    const distance = calculateMoveCost(from, to)

    // Check blocked
    const isBlocked = blockedCells.some(c => c.x === to.x && c.y === to.y)
    if (isBlocked) {
      return { valid: false, distance, cost: Infinity, reason: 'Destination is blocked' }
    }

    // Check terrain at destination
    if (getTerrainCost) {
      const terrainCost = getTerrainCost(to.x, to.y)
      if (!isFinite(terrainCost)) {
        return { valid: false, distance, cost: Infinity, reason: 'Destination is impassable terrain' }
      }
    }

    // For simple validation, calculate minimum path cost
    // This is simplified - for true pathfinding, use getMovementRangeCells
    const reachable = getMovementRangeCells(from, speed, blockedCells, getTerrainCost)
    const canReach = reachable.some(c => c.x === to.x && c.y === to.y)

    if (!canReach) {
      // Determine why
      if (distance > speed) {
        return { valid: false, distance, cost: distance, reason: `Exceeds movement speed (${distance} > ${speed})` }
      }
      return { valid: false, distance, cost: distance, reason: 'Cannot reach destination (terrain or obstacles)' }
    }

    return { valid: true, distance, cost: distance }
  }

  /**
   * Calculate the actual path cost between two points through terrain
   * Uses A* pathfinding with PTU diagonal rules
   */
  function calculatePathCost(
    from: GridPosition,
    to: GridPosition,
    blockedCells: GridPosition[] = [],
    getTerrainCost?: TerrainCostGetter
  ): { cost: number; path: GridPosition[] } | null {
    const blockedSet = new Set(blockedCells.map(c => `${c.x},${c.y}`))
    const destKey = `${to.x},${to.y}`

    // Check if destination is blocked
    if (blockedSet.has(destKey)) {
      return null
    }

    // Check if destination terrain is passable
    if (getTerrainCost) {
      const terrainCost = getTerrainCost(to.x, to.y)
      if (!isFinite(terrainCost)) {
        return null
      }
    }

    // A* pathfinding with diagonal parity tracking
    // State includes position and diagonal parity
    const openSet = new Map<string, { x: number; y: number; g: number; f: number; parity: number; parent: string | null }>()
    const closedSet = new Set<string>()

    const startKey = `${from.x},${from.y}`
    // Heuristic: use minimum possible cost (all diagonals at 1.5 average)
    const heuristic = (x: number, y: number) => {
      const dx = Math.abs(to.x - x)
      const dy = Math.abs(to.y - y)
      const diagonals = Math.min(dx, dy)
      const straights = Math.abs(dx - dy)
      return diagonals + Math.floor(diagonals / 2) + straights
    }

    openSet.set(startKey, {
      x: from.x,
      y: from.y,
      g: 0,
      f: heuristic(from.x, from.y),
      parity: 0,
      parent: null,
    })

    const directions: Array<[number, number, boolean]> = [
      [-1, -1, true], [-1, 0, false], [-1, 1, true],
      [0, -1, false], [0, 1, false],
      [1, -1, true], [1, 0, false], [1, 1, true],
    ]

    while (openSet.size > 0) {
      // Find node with lowest f score
      let current: { key: string; node: { x: number; y: number; g: number; f: number; parity: number; parent: string | null } } | null = null
      for (const [key, node] of openSet) {
        if (!current || node.f < current.node.f) {
          current = { key, node }
        }
      }

      if (!current) break

      // Check if we reached the destination
      if (current.node.x === to.x && current.node.y === to.y) {
        const path: GridPosition[] = [{ x: to.x, y: to.y }]
        if (from.x !== to.x || from.y !== to.y) {
          path.unshift({ x: from.x, y: from.y })
        }
        return { cost: current.node.g, path }
      }

      // Move to closed set
      openSet.delete(current.key)
      closedSet.add(current.key)

      // Explore neighbors
      for (const [dx, dy, isDiagonal] of directions) {
        const nx = current.node.x + dx
        const ny = current.node.y + dy
        const neighborKey = `${nx},${ny}`

        if (closedSet.has(neighborKey)) continue
        if (blockedSet.has(neighborKey)) continue

        const terrainMultiplier = getTerrainCost ? getTerrainCost(nx, ny) : 1
        if (!isFinite(terrainMultiplier)) continue

        // Calculate move cost with PTU diagonal rules
        let baseCost: number
        let newParity: number
        if (isDiagonal) {
          baseCost = current.node.parity === 0 ? 1 : 2
          newParity = 1 - current.node.parity
        } else {
          baseCost = 1
          newParity = current.node.parity
        }

        const g = current.node.g + baseCost * terrainMultiplier
        const f = g + heuristic(nx, ny)

        const existing = openSet.get(neighborKey)
        if (!existing || g < existing.g) {
          openSet.set(neighborKey, {
            x: nx,
            y: ny,
            g,
            f,
            parity: newParity,
            parent: current.key,
          })
        }
      }
    }

    return null // No path found
  }

  return {
    parseRange,
    isInRange,
    hasLineOfSight,
    getAffectedCells,
    getMovementRangeCells,
    calculateMoveCost,
    validateMovement,
    calculatePathCost,
  }
}
