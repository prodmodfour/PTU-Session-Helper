import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  parseDiceNotation,
  rollDie,
  rollDice,
  roll,
  rollCritical,
  getMinRoll,
  getMaxRoll,
  getAverageRoll
} from '~/utils/diceRoller'

describe('diceRoller', () => {
  describe('parseDiceNotation', () => {
    it('parses basic notation (2d6)', () => {
      const result = parseDiceNotation('2d6')
      expect(result).toEqual({ count: 2, sides: 6, modifier: 0 })
    })

    it('parses notation with positive modifier (1d8+5)', () => {
      const result = parseDiceNotation('1d8+5')
      expect(result).toEqual({ count: 1, sides: 8, modifier: 5 })
    })

    it('parses notation with negative modifier (3d10-2)', () => {
      const result = parseDiceNotation('3d10-2')
      expect(result).toEqual({ count: 3, sides: 10, modifier: -2 })
    })

    it('parses large numbers (6d12+35)', () => {
      const result = parseDiceNotation('6d12+35')
      expect(result).toEqual({ count: 6, sides: 12, modifier: 35 })
    })

    it('returns null for invalid notation', () => {
      expect(parseDiceNotation('invalid')).toBeNull()
      expect(parseDiceNotation('2d')).toBeNull()
      expect(parseDiceNotation('d6')).toBeNull()
      expect(parseDiceNotation('')).toBeNull()
    })
  })

  describe('rollDie', () => {
    it('returns a value between 1 and sides', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDie(6)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(6)
      }
    })

    it('returns integers only', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDie(20)
        expect(Number.isInteger(result)).toBe(true)
      }
    })
  })

  describe('rollDice', () => {
    it('returns the correct number of dice', () => {
      const result = rollDice(5, 6)
      expect(result).toHaveLength(5)
    })

    it('all dice are within valid range', () => {
      const result = rollDice(10, 10)
      result.forEach(die => {
        expect(die).toBeGreaterThanOrEqual(1)
        expect(die).toBeLessThanOrEqual(10)
      })
    })
  })

  describe('roll', () => {
    beforeEach(() => {
      // Mock Math.random for predictable results
      vi.spyOn(Math, 'random')
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('returns correct structure', () => {
      const result = roll('2d6+8')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('dice')
      expect(result).toHaveProperty('modifier')
      expect(result).toHaveProperty('notation')
      expect(result).toHaveProperty('breakdown')
    })

    it('calculates total correctly with mocked rolls', () => {
      // Mock to always return 0.5 (which gives middle values)
      // For d6: Math.floor(0.5 * 6) + 1 = 4
      vi.mocked(Math.random).mockReturnValue(0.5)

      const result = roll('2d6+8')
      expect(result.dice).toEqual([4, 4])
      expect(result.total).toBe(16) // 4 + 4 + 8
      expect(result.modifier).toBe(8)
    })

    it('handles notation without modifier', () => {
      vi.mocked(Math.random).mockReturnValue(0.5)

      const result = roll('3d10')
      expect(result.modifier).toBe(0)
      expect(result.dice).toHaveLength(3)
    })

    it('handles invalid notation', () => {
      const result = roll('invalid')
      expect(result.total).toBe(0)
      expect(result.dice).toEqual([])
      expect(result.breakdown).toBe('Invalid notation')
    })

    it('creates correct breakdown string', () => {
      vi.mocked(Math.random).mockReturnValue(0.5)

      const result = roll('2d6+8')
      expect(result.breakdown).toContain('[4, 4]')
      expect(result.breakdown).toContain('+8')
      expect(result.breakdown).toContain('= 16')
    })
  })

  describe('rollCritical', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random')
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('rolls dice twice', () => {
      vi.mocked(Math.random).mockReturnValue(0.5)

      const result = rollCritical('2d6+8')
      // 2 dice rolled twice = 4 total dice
      expect(result.dice).toHaveLength(4)
    })

    it('adds modifier only once', () => {
      vi.mocked(Math.random).mockReturnValue(0.5)

      const result = rollCritical('2d6+8')
      expect(result.modifier).toBe(8)
      // 4 + 4 + 4 + 4 + 8 = 24
      expect(result.total).toBe(24)
    })

    it('indicates critical in breakdown', () => {
      const result = rollCritical('1d6+1')
      expect(result.breakdown).toContain('CRIT')
    })
  })

  describe('getMinRoll', () => {
    it('calculates minimum correctly', () => {
      expect(getMinRoll('2d6+8')).toBe(10) // 2 (min) + 8
      expect(getMinRoll('3d10+10')).toBe(13) // 3 (min) + 10
      expect(getMinRoll('1d6+1')).toBe(2) // 1 (min) + 1
    })

    it('handles negative modifiers', () => {
      expect(getMinRoll('2d6-2')).toBe(0) // 2 (min) - 2
    })

    it('returns 0 for invalid notation', () => {
      expect(getMinRoll('invalid')).toBe(0)
    })
  })

  describe('getMaxRoll', () => {
    it('calculates maximum correctly', () => {
      expect(getMaxRoll('2d6+8')).toBe(20) // 12 (max) + 8
      expect(getMaxRoll('3d10+10')).toBe(40) // 30 (max) + 10
      expect(getMaxRoll('1d6+1')).toBe(7) // 6 (max) + 1
    })

    it('handles negative modifiers', () => {
      expect(getMaxRoll('2d6-2')).toBe(10) // 12 (max) - 2
    })

    it('returns 0 for invalid notation', () => {
      expect(getMaxRoll('invalid')).toBe(0)
    })
  })

  describe('getAverageRoll', () => {
    it('calculates average correctly', () => {
      // Average of d6 = 3.5, so 2d6 = 7, +8 = 15 (floored)
      expect(getAverageRoll('2d6+8')).toBe(15)
      // Average of d10 = 5.5, so 3d10 = 16.5 (floored to 16), +10 = 26
      expect(getAverageRoll('3d10+10')).toBe(26)
    })

    it('returns 0 for invalid notation', () => {
      expect(getAverageRoll('invalid')).toBe(0)
    })
  })
})
