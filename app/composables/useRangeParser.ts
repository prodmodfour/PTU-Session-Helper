import type { RangeType, ParsedRange, GridPosition } from '~/types'

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
   * Check if a target position is within range of an attacker
   */
  function isInRange(
    attacker: GridPosition,
    target: GridPosition,
    parsedRange: RangeParseResult
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
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
    }

    // Check min range if applicable
    if (parsedRange.minRange && distance < parsedRange.minRange) {
      return false
    }

    return distance <= parsedRange.range
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
   * Get movement range visualization cells
   */
  function getMovementRangeCells(
    origin: GridPosition,
    speed: number,
    blockedCells: GridPosition[] = []
  ): GridPosition[] {
    const cells: GridPosition[] = []
    const blockedSet = new Set(blockedCells.map(c => `${c.x},${c.y}`))

    // All cells within Chebyshev distance of speed
    for (let dx = -speed; dx <= speed; dx++) {
      for (let dy = -speed; dy <= speed; dy++) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy))
        if (distance <= speed && distance > 0) {
          const cell = { x: origin.x + dx, y: origin.y + dy }
          if (!blockedSet.has(`${cell.x},${cell.y}`)) {
            cells.push(cell)
          }
        }
      }
    }

    return cells
  }

  /**
   * Validate if a movement is legal
   */
  function validateMovement(
    from: GridPosition,
    to: GridPosition,
    speed: number,
    blockedCells: GridPosition[] = []
  ): { valid: boolean; distance: number; reason?: string } {
    const distance = Math.max(
      Math.abs(to.x - from.x),
      Math.abs(to.y - from.y)
    )

    // Check blocked
    const isBlocked = blockedCells.some(c => c.x === to.x && c.y === to.y)
    if (isBlocked) {
      return { valid: false, distance, reason: 'Destination is blocked' }
    }

    // Check distance
    if (distance > speed) {
      return { valid: false, distance, reason: `Exceeds movement speed (${distance} > ${speed})` }
    }

    return { valid: true, distance }
  }

  return {
    parseRange,
    isInRange,
    getAffectedCells,
    getMovementRangeCells,
    validateMovement,
  }
}
