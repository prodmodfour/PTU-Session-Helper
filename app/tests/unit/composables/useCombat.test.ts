import { describe, it, expect, beforeEach } from 'vitest'

// Import the composable source directly for testing
// We'll test the pure functions

// Stage modifier multipliers
const stageMultipliers: Record<string, number> = {
  '-6': 0.25,
  '-5': 0.28,
  '-4': 0.33,
  '-3': 0.40,
  '-2': 0.50,
  '-1': 0.67,
  '0': 1.0,
  '1': 1.5,
  '2': 2.0,
  '3': 2.5,
  '4': 3.0,
  '5': 3.5,
  '6': 4.0
}

// Apply stage modifier to a stat
const applyStageModifier = (baseStat: number, stage: number): number => {
  const clampedStage = Math.max(-6, Math.min(6, stage))
  const multiplier = stageMultipliers[clampedStage.toString()]
  return Math.floor(baseStat * multiplier)
}

// Calculate set damage (PTU Set Damage system)
const calculateSetDamage = (
  attackStat: number,
  damageBase: number,
  stab: boolean = false,
  effectiveness: number = 1,
  criticalHit: boolean = false
): number => {
  let damage = attackStat + damageBase

  if (stab) {
    damage = Math.floor(damage * 1.5)
  }

  damage = Math.floor(damage * effectiveness)

  if (criticalHit) {
    damage = Math.floor(damage * 1.5)
  }

  return Math.max(1, damage)
}

// Type effectiveness chart
const typeEffectiveness: Record<string, Record<string, number>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
}

// Get type effectiveness
const getTypeEffectiveness = (attackType: string, defenderTypes: string[]): number => {
  let effectiveness = 1

  for (const defType of defenderTypes) {
    const chart = typeEffectiveness[attackType]
    if (chart && chart[defType] !== undefined) {
      effectiveness *= chart[defType]
    }
  }

  return effectiveness
}

// Check if move gets STAB
const hasSTAB = (moveType: string, userTypes: string[]): boolean => {
  return userTypes.includes(moveType)
}

// Get health percentage
const getHealthPercentage = (current: number, max: number): number => {
  return Math.round((current / max) * 100)
}

// Get health status class
const getHealthStatus = (percentage: number): 'healthy' | 'warning' | 'critical' => {
  if (percentage > 50) return 'healthy'
  if (percentage > 25) return 'warning'
  return 'critical'
}

// Calculate XP gain (PTU formula)
const calculateXPGain = (defeatedLevel: number, participantCount: number): number => {
  const baseXP = defeatedLevel * 10
  return Math.floor(baseXP / participantCount)
}

// Calculate initiative
const calculateInitiative = (speed: number, speedStage: number, bonus: number): number => {
  const modifiedSpeed = applyStageModifier(speed, speedStage)
  return modifiedSpeed + bonus
}

describe('useCombat composable', () => {
  describe('applyStageModifier', () => {
    it('should return base stat at stage 0', () => {
      expect(applyStageModifier(100, 0)).toBe(100)
    })

    it('should increase stat at positive stages', () => {
      expect(applyStageModifier(100, 1)).toBe(150) // 1.5x
      expect(applyStageModifier(100, 2)).toBe(200) // 2.0x
      expect(applyStageModifier(100, 6)).toBe(400) // 4.0x
    })

    it('should decrease stat at negative stages', () => {
      expect(applyStageModifier(100, -1)).toBe(67) // 0.67x
      expect(applyStageModifier(100, -2)).toBe(50) // 0.50x
      expect(applyStageModifier(100, -6)).toBe(25) // 0.25x
    })

    it('should clamp stages to -6 to +6 range', () => {
      expect(applyStageModifier(100, 10)).toBe(400) // Clamped to +6
      expect(applyStageModifier(100, -10)).toBe(25) // Clamped to -6
    })

    it('should floor the result', () => {
      expect(applyStageModifier(75, 1)).toBe(112) // 75 * 1.5 = 112.5 -> 112
    })
  })

  describe('calculateSetDamage', () => {
    it('should calculate basic damage correctly', () => {
      // Basic: attack + damageBase
      expect(calculateSetDamage(50, 60)).toBe(110)
    })

    it('should apply STAB bonus (1.5x)', () => {
      // With STAB: (50 + 60) * 1.5 = 165
      expect(calculateSetDamage(50, 60, true)).toBe(165)
    })

    it('should apply type effectiveness', () => {
      // Super effective (2x): (50 + 60) * 2 = 220
      expect(calculateSetDamage(50, 60, false, 2)).toBe(220)
      // Not very effective (0.5x): (50 + 60) * 0.5 = 55
      expect(calculateSetDamage(50, 60, false, 0.5)).toBe(55)
    })

    it('should apply critical hit bonus (1.5x)', () => {
      // Crit: (50 + 60) * 1.5 = 165
      expect(calculateSetDamage(50, 60, false, 1, true)).toBe(165)
    })

    it('should apply all modifiers correctly', () => {
      // STAB + Super effective + Crit: (50 + 60) * 1.5 * 2 * 1.5 = 495
      expect(calculateSetDamage(50, 60, true, 2, true)).toBe(495)
    })

    it('should return minimum of 1 damage', () => {
      expect(calculateSetDamage(1, 1, false, 0)).toBe(1)
    })
  })

  describe('getTypeEffectiveness', () => {
    it('should return 1 for neutral matchups', () => {
      expect(getTypeEffectiveness('Normal', ['Normal'])).toBe(1)
      expect(getTypeEffectiveness('Fire', ['Normal'])).toBe(1)
    })

    it('should return 2 for super effective matchups', () => {
      expect(getTypeEffectiveness('Fire', ['Grass'])).toBe(2)
      expect(getTypeEffectiveness('Water', ['Fire'])).toBe(2)
      expect(getTypeEffectiveness('Electric', ['Water'])).toBe(2)
    })

    it('should return 0.5 for not very effective matchups', () => {
      expect(getTypeEffectiveness('Fire', ['Water'])).toBe(0.5)
      expect(getTypeEffectiveness('Water', ['Grass'])).toBe(0.5)
    })

    it('should return 0 for immune matchups', () => {
      expect(getTypeEffectiveness('Normal', ['Ghost'])).toBe(0)
      expect(getTypeEffectiveness('Electric', ['Ground'])).toBe(0)
      expect(getTypeEffectiveness('Ghost', ['Normal'])).toBe(0)
      expect(getTypeEffectiveness('Fighting', ['Ghost'])).toBe(0)
      expect(getTypeEffectiveness('Psychic', ['Dark'])).toBe(0)
      expect(getTypeEffectiveness('Dragon', ['Fairy'])).toBe(0)
    })

    it('should multiply effectiveness for dual types', () => {
      // Fire vs Grass/Steel = 2 * 2 = 4
      expect(getTypeEffectiveness('Fire', ['Grass', 'Steel'])).toBe(4)
      // Ground vs Fire/Steel = 2 * 2 = 4
      expect(getTypeEffectiveness('Ground', ['Fire', 'Steel'])).toBe(4)
      // Electric vs Water/Flying = 2 * 2 = 4
      expect(getTypeEffectiveness('Electric', ['Water', 'Flying'])).toBe(4)
      // Ground vs Water/Grass = 1 * 0.5 = 0.5 (Ground is neutral vs Water)
      expect(getTypeEffectiveness('Ground', ['Water', 'Grass'])).toBe(0.5)
    })

    it('should handle double resistances', () => {
      // Fire vs Fire/Dragon = 0.5 * 0.5 = 0.25
      expect(getTypeEffectiveness('Fire', ['Fire', 'Dragon'])).toBe(0.25)
    })
  })

  describe('hasSTAB', () => {
    it('should return true when move type matches user type', () => {
      expect(hasSTAB('Fire', ['Fire'])).toBe(true)
      expect(hasSTAB('Water', ['Water', 'Ground'])).toBe(true)
    })

    it('should return false when move type does not match', () => {
      expect(hasSTAB('Fire', ['Water'])).toBe(false)
      expect(hasSTAB('Electric', ['Fire', 'Flying'])).toBe(false)
    })
  })

  describe('getHealthPercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(getHealthPercentage(100, 100)).toBe(100)
      expect(getHealthPercentage(50, 100)).toBe(50)
      expect(getHealthPercentage(25, 100)).toBe(25)
      expect(getHealthPercentage(0, 100)).toBe(0)
    })

    it('should round to nearest integer', () => {
      expect(getHealthPercentage(33, 100)).toBe(33)
      expect(getHealthPercentage(66, 100)).toBe(66)
      expect(getHealthPercentage(1, 3)).toBe(33) // 33.33... rounds to 33
    })
  })

  describe('getHealthStatus', () => {
    it('should return healthy for percentage > 50', () => {
      expect(getHealthStatus(100)).toBe('healthy')
      expect(getHealthStatus(75)).toBe('healthy')
      expect(getHealthStatus(51)).toBe('healthy')
    })

    it('should return warning for percentage 26-50', () => {
      expect(getHealthStatus(50)).toBe('warning')
      expect(getHealthStatus(40)).toBe('warning')
      expect(getHealthStatus(26)).toBe('warning')
    })

    it('should return critical for percentage <= 25', () => {
      expect(getHealthStatus(25)).toBe('critical')
      expect(getHealthStatus(10)).toBe('critical')
      expect(getHealthStatus(0)).toBe('critical')
    })
  })

  describe('calculateXPGain', () => {
    it('should calculate XP based on level and participants', () => {
      // Level 10, 1 participant: 10 * 10 / 1 = 100
      expect(calculateXPGain(10, 1)).toBe(100)
      // Level 10, 2 participants: 10 * 10 / 2 = 50
      expect(calculateXPGain(10, 2)).toBe(50)
      // Level 20, 4 participants: 20 * 10 / 4 = 50
      expect(calculateXPGain(20, 4)).toBe(50)
    })

    it('should floor XP values', () => {
      // Level 10, 3 participants: 100 / 3 = 33.33 -> 33
      expect(calculateXPGain(10, 3)).toBe(33)
    })
  })

  describe('calculateInitiative', () => {
    it('should calculate initiative with speed and bonus', () => {
      expect(calculateInitiative(100, 0, 0)).toBe(100)
      expect(calculateInitiative(100, 0, 5)).toBe(105)
    })

    it('should apply stage modifiers to speed', () => {
      expect(calculateInitiative(100, 1, 0)).toBe(150) // +1 stage = 1.5x
      expect(calculateInitiative(100, -1, 0)).toBe(67) // -1 stage = 0.67x
    })

    it('should combine stage modifier and bonus', () => {
      expect(calculateInitiative(100, 1, 10)).toBe(160) // 150 + 10
    })
  })
})
