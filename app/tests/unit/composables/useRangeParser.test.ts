import { describe, it, expect } from 'vitest'
import { useRangeParser } from '~/composables/useRangeParser'

describe('useRangeParser', () => {
  const { parseRange, isInRange, validateMovement, getMovementRangeCells } = useRangeParser()

  describe('parseRange', () => {
    it('should parse "Melee" as melee range 1', () => {
      const result = parseRange('Melee')
      expect(result.type).toBe('melee')
      expect(result.range).toBe(1)
    })

    it('should parse "Melee, 1 Target" with target count', () => {
      const result = parseRange('Melee, 1 Target')
      expect(result.type).toBe('melee')
      expect(result.range).toBe(1)
      expect(result.targetCount).toBe(1)
    })

    it('should parse simple ranged "6"', () => {
      const result = parseRange('6')
      expect(result.type).toBe('ranged')
      expect(result.range).toBe(6)
    })

    it('should parse ranged with targets "8, 1 Target"', () => {
      const result = parseRange('8, 1 Target')
      expect(result.type).toBe('ranged')
      expect(result.range).toBe(8)
      expect(result.targetCount).toBe(1)
    })

    it('should parse "Burst 2"', () => {
      const result = parseRange('Burst 2')
      expect(result.type).toBe('burst')
      expect(result.aoeSize).toBe(2)
    })

    it('should parse "Cone 3"', () => {
      const result = parseRange('Cone 3')
      expect(result.type).toBe('cone')
      expect(result.aoeSize).toBe(3)
      expect(result.range).toBe(3)
    })

    it('should parse "Close Blast 2"', () => {
      const result = parseRange('Close Blast 2')
      expect(result.type).toBe('close-blast')
      expect(result.aoeSize).toBe(2)
      expect(result.range).toBe(1)
    })

    it('should parse "Line 6"', () => {
      const result = parseRange('Line 6')
      expect(result.type).toBe('line')
      expect(result.aoeSize).toBe(6)
    })

    it('should parse "Self"', () => {
      const result = parseRange('Self')
      expect(result.type).toBe('self')
      expect(result.range).toBe(0)
    })

    it('should parse "Field"', () => {
      const result = parseRange('Field')
      expect(result.type).toBe('field')
      expect(result.range).toBe(Infinity)
    })

    it('should parse "Cardinally Adjacent"', () => {
      const result = parseRange('Cardinally Adjacent')
      expect(result.type).toBe('cardinally-adjacent')
      expect(result.range).toBe(1)
    })

    it('should handle empty string as melee', () => {
      const result = parseRange('')
      expect(result.type).toBe('melee')
      expect(result.range).toBe(1)
    })
  })

  describe('isInRange', () => {
    const origin = { x: 5, y: 5 }

    it('should correctly check melee range', () => {
      const melee = { type: 'melee' as const, range: 1 }

      // Adjacent should be in range
      expect(isInRange(origin, { x: 6, y: 5 }, melee)).toBe(true)
      expect(isInRange(origin, { x: 5, y: 6 }, melee)).toBe(true)
      expect(isInRange(origin, { x: 6, y: 6 }, melee)).toBe(true) // Diagonal

      // 2 cells away should be out of range
      expect(isInRange(origin, { x: 7, y: 5 }, melee)).toBe(false)
    })

    it('should correctly check ranged attacks', () => {
      const ranged = { type: 'ranged' as const, range: 6 }

      expect(isInRange(origin, { x: 11, y: 5 }, ranged)).toBe(true) // Exactly 6
      expect(isInRange(origin, { x: 12, y: 5 }, ranged)).toBe(false) // 7, out of range
    })

    it('should only allow self for self type', () => {
      const self = { type: 'self' as const, range: 0 }

      expect(isInRange(origin, origin, self)).toBe(true)
      expect(isInRange(origin, { x: 6, y: 5 }, self)).toBe(false)
    })

    it('should allow any distance for field type', () => {
      const field = { type: 'field' as const, range: Infinity }

      expect(isInRange(origin, { x: 100, y: 100 }, field)).toBe(true)
    })

    it('should correctly check cardinally adjacent (no diagonals)', () => {
      const cardinal = { type: 'cardinally-adjacent' as const, range: 1 }

      // Orthogonal adjacent should work
      expect(isInRange(origin, { x: 6, y: 5 }, cardinal)).toBe(true)
      expect(isInRange(origin, { x: 4, y: 5 }, cardinal)).toBe(true)
      expect(isInRange(origin, { x: 5, y: 6 }, cardinal)).toBe(true)
      expect(isInRange(origin, { x: 5, y: 4 }, cardinal)).toBe(true)

      // Diagonal should NOT work
      expect(isInRange(origin, { x: 6, y: 6 }, cardinal)).toBe(false)
    })
  })

  describe('validateMovement', () => {
    const origin = { x: 5, y: 5 }

    it('should allow movement within speed', () => {
      const result = validateMovement(origin, { x: 8, y: 5 }, 5)
      expect(result.valid).toBe(true)
      expect(result.distance).toBe(3)
    })

    it('should reject movement beyond speed', () => {
      const result = validateMovement(origin, { x: 12, y: 5 }, 5)
      expect(result.valid).toBe(false)
      expect(result.distance).toBe(7)
      expect(result.reason).toContain('Exceeds movement speed')
    })

    it('should reject movement to blocked cell', () => {
      const blocked = [{ x: 8, y: 5 }]
      const result = validateMovement(origin, { x: 8, y: 5 }, 5, blocked)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Destination is blocked')
    })

    it('should use Chebyshev distance (diagonal = 1)', () => {
      // Diagonal movement should cost same as orthogonal
      const result = validateMovement(origin, { x: 8, y: 8 }, 5)
      expect(result.valid).toBe(true)
      expect(result.distance).toBe(3) // Not 4.24 (Euclidean) or 6 (Manhattan)
    })
  })

  describe('getMovementRangeCells', () => {
    const origin = { x: 5, y: 5 }

    it('should return correct cells for speed 1', () => {
      const cells = getMovementRangeCells(origin, 1)
      expect(cells).toHaveLength(8) // 8 adjacent cells (not including origin)

      // Check some expected cells
      expect(cells).toContainEqual({ x: 6, y: 5 })
      expect(cells).toContainEqual({ x: 4, y: 5 })
      expect(cells).toContainEqual({ x: 6, y: 6 })
    })

    it('should return correct cells for speed 2', () => {
      const cells = getMovementRangeCells(origin, 2)
      // 5x5 square minus center = 24 cells
      expect(cells).toHaveLength(24)
    })

    it('should exclude blocked cells', () => {
      const blocked = [{ x: 6, y: 5 }, { x: 5, y: 6 }]
      const cells = getMovementRangeCells(origin, 1, blocked)
      expect(cells).toHaveLength(6) // 8 - 2 blocked
      expect(cells).not.toContainEqual({ x: 6, y: 5 })
      expect(cells).not.toContainEqual({ x: 5, y: 6 })
    })

    it('should not include origin cell', () => {
      const cells = getMovementRangeCells(origin, 2)
      expect(cells).not.toContainEqual(origin)
    })
  })
})
