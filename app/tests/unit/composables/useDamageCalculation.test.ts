import { describe, it, expect } from 'vitest'
import { useDamageCalculation } from '~/composables/useDamageCalculation'

const {
  damageBaseChart,
  getSetDamage,
  getSetDamageByType,
  getDamageRoll,
  calculateDamage,
  calculateSetDamage,
  getDamageByMode
} = useDamageCalculation()

describe('useDamageCalculation composable', () => {
  describe('damageBaseChart', () => {
    it('should have entries for DB 1 through 28', () => {
      for (let db = 1; db <= 28; db++) {
        expect(damageBaseChart[db]).toBeDefined()
        expect(damageBaseChart[db].rolled).toBeDefined()
        expect(damageBaseChart[db].set).toHaveLength(3)
      }
    })

    it('should have set values in ascending order (min < avg < max)', () => {
      for (let db = 1; db <= 28; db++) {
        const [min, avg, max] = damageBaseChart[db].set
        expect(min).toBeLessThanOrEqual(avg)
        expect(avg).toBeLessThanOrEqual(max)
      }
    })
  })

  describe('getSetDamage', () => {
    it('should return average set damage for a damage base', () => {
      // DB 1: set [2, 5, 7] → avg = 5
      expect(getSetDamage(1)).toBe(5)
      // DB 6: set [10, 15, 20] → avg = 15
      expect(getSetDamage(6)).toBe(15)
      // DB 10: set [13, 24, 34] → avg = 24
      expect(getSetDamage(10)).toBe(24)
    })

    it('should clamp to valid range (1-28)', () => {
      expect(getSetDamage(0)).toBe(getSetDamage(1))
      expect(getSetDamage(30)).toBe(getSetDamage(28))
    })
  })

  describe('getSetDamageByType', () => {
    it('should return min, avg, or max based on type', () => {
      // DB 6: set [10, 15, 20]
      expect(getSetDamageByType(6, 'min')).toBe(10)
      expect(getSetDamageByType(6, 'avg')).toBe(15)
      expect(getSetDamageByType(6, 'max')).toBe(20)
    })
  })

  describe('getDamageRoll', () => {
    it('should return dice notation for a damage base', () => {
      expect(getDamageRoll(1)).toBe('1d6+1')
      expect(getDamageRoll(6)).toBe('2d6+8')
      expect(getDamageRoll(10)).toBe('3d8+10')
    })

    it('should clamp to valid range', () => {
      expect(getDamageRoll(0)).toBe(getDamageRoll(1))
      expect(getDamageRoll(30)).toBe(getDamageRoll(28))
    })
  })

  describe('calculateDamage', () => {
    it('should calculate basic damage: chart lookup + attack - defense', () => {
      // DB 6 avg = 15, attack 20, defense 10 → 15 + 20 - 10 = 25
      const result = calculateDamage(6, 20, 10)
      expect(result.damage).toBe(25)
      expect(result.effectiveDB).toBe(6)
      expect(result.baseDamage).toBe(15)
    })

    it('should apply STAB as +2 to damage base', () => {
      // DB 6 + STAB = DB 8, avg = 19, attack 20, defense 10 → 19 + 20 - 10 = 29
      const result = calculateDamage(6, 20, 10, true)
      expect(result.effectiveDB).toBe(8)
      expect(result.baseDamage).toBe(19) // DB 8 avg
      expect(result.damage).toBe(29)
    })

    it('should apply type effectiveness after defense subtraction', () => {
      // DB 6 avg = 15, attack 20, defense 10 → 25, then × 1.5 = 37.5 → 37
      const result = calculateDamage(6, 20, 10, false, 1.5)
      expect(result.damage).toBe(37)
    })

    it('should apply critical hit by doubling chart damage', () => {
      // DB 6 avg = 15, crit adds another 15 → baseDamage 30, + attack 20 - defense 10 = 40
      const result = calculateDamage(6, 20, 10, false, 1, true)
      expect(result.baseDamage).toBe(30)
      expect(result.damage).toBe(40)
    })

    it('should enforce minimum 1 damage after defense', () => {
      // DB 1 avg = 5, attack 1, defense 100 → 5 + 1 - 100 = -94 → clamped to 1
      const result = calculateDamage(1, 1, 100)
      expect(result.damage).toBe(1)
    })

    it('should enforce minimum 1 damage after effectiveness', () => {
      // DB 1 avg = 5, attack 5, defense 9 → 1, then × 0.5 = 0.5 → floor 0 → clamp 1
      const result = calculateDamage(1, 5, 9, false, 0.5)
      expect(result.damage).toBe(1)
    })

    it('should combine STAB + effectiveness + crit correctly', () => {
      // DB 6, STAB → DB 8 (avg 19), crit → 19+19=38, attack 20, defense 10
      // (38 + 20 - 10) = 48, × 1.5 effectiveness = 72
      const result = calculateDamage(6, 20, 10, true, 1.5, true)
      expect(result.effectiveDB).toBe(8)
      expect(result.baseDamage).toBe(38)
      expect(result.damage).toBe(72)
    })
  })

  describe('calculateSetDamage (simplified)', () => {
    it('should return just the damage number', () => {
      // Wraps calculateDamage — attack 20, DB 6, no mods, defense 10
      expect(calculateSetDamage(20, 6, false, 1, false, 10)).toBe(25)
    })

    it('should default defense to 0 when omitted', () => {
      // DB 6 avg = 15, attack 20, defense 0 → 15 + 20 = 35
      expect(calculateSetDamage(20, 6)).toBe(35)
    })
  })

  describe('getDamageByMode', () => {
    it('should return set damage average in set mode', () => {
      const result = getDamageByMode(6, 'set')
      expect(result.value).toBe(15)
      expect(result.rollResult).toBeUndefined()
    })

    it('should double set damage on critical in set mode', () => {
      const result = getDamageByMode(6, 'set', true)
      expect(result.value).toBe(30)
    })

    it('should return a roll result in rolled mode', () => {
      const result = getDamageByMode(6, 'rolled')
      expect(result.value).toBeGreaterThan(0)
      expect(result.rollResult).toBeDefined()
      expect(result.rollResult!.total).toBe(result.value)
    })
  })
})
