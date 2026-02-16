import type { DamageMode } from '~/types'
import { roll, rollCritical, type DiceRollResult } from '~/utils/diceRoller'

// PTU 1.05 damage calculation utilities
export function useDamageCalculation() {
  // ===========================================
  // PTU Damage Base Chart (Set Damage)
  // Format: [min, average, max]
  // ===========================================
  const damageBaseChart: Record<number, { rolled: string; set: [number, number, number] }> = {
    1: { rolled: '1d6+1', set: [2, 5, 7] },
    2: { rolled: '1d6+3', set: [4, 7, 9] },
    3: { rolled: '1d6+5', set: [6, 9, 11] },
    4: { rolled: '1d8+6', set: [7, 11, 14] },
    5: { rolled: '1d8+8', set: [9, 13, 16] },
    6: { rolled: '2d6+8', set: [10, 15, 20] },
    7: { rolled: '2d6+10', set: [12, 17, 22] },
    8: { rolled: '2d8+10', set: [12, 19, 26] },
    9: { rolled: '2d10+10', set: [12, 21, 30] },
    10: { rolled: '3d8+10', set: [13, 24, 34] },
    11: { rolled: '3d10+10', set: [13, 27, 40] },
    12: { rolled: '3d12+10', set: [13, 30, 46] },
    13: { rolled: '4d10+10', set: [14, 35, 50] },
    14: { rolled: '4d10+15', set: [19, 40, 55] },
    15: { rolled: '4d10+20', set: [24, 45, 60] },
    16: { rolled: '5d10+20', set: [25, 50, 70] },
    17: { rolled: '5d12+25', set: [30, 60, 85] },
    18: { rolled: '6d12+25', set: [31, 65, 97] },
    19: { rolled: '6d12+30', set: [36, 70, 102] },
    20: { rolled: '6d12+35', set: [41, 75, 107] },
    21: { rolled: '6d12+40', set: [46, 80, 112] },
    22: { rolled: '6d12+45', set: [51, 85, 117] },
    23: { rolled: '6d12+50', set: [56, 90, 122] },
    24: { rolled: '6d12+55', set: [61, 95, 127] },
    25: { rolled: '6d12+60', set: [66, 100, 132] },
    26: { rolled: '7d12+65', set: [72, 110, 149] },
    27: { rolled: '8d12+70', set: [78, 120, 166] },
    28: { rolled: '8d12+80', set: [88, 130, 176] }
  }

  // Get set damage for a damage base (returns average)
  const getSetDamage = (damageBase: number): number => {
    const clamped = Math.max(1, Math.min(28, damageBase))
    return damageBaseChart[clamped]?.set[1] ?? 0
  }

  // Get damage roll string for a damage base
  const getDamageRoll = (damageBase: number): string => {
    const clamped = Math.max(1, Math.min(28, damageBase))
    return damageBaseChart[clamped]?.rolled ?? '1d6+1'
  }

  // Get set damage value by type (min, avg, max)
  const getSetDamageByType = (damageBase: number, type: 'min' | 'avg' | 'max'): number => {
    const clamped = Math.max(1, Math.min(28, damageBase))
    const setValues = damageBaseChart[clamped]?.set ?? [2, 5, 7]
    const index = type === 'min' ? 0 : type === 'avg' ? 1 : 2
    return setValues[index]
  }

  // Roll damage for a damage base
  const rollDamageBase = (damageBase: number, critical: boolean = false): DiceRollResult => {
    const notation = getDamageRoll(damageBase)
    return critical ? rollCritical(notation) : roll(notation)
  }

  // Get damage based on mode
  const getDamageByMode = (
    damageBase: number,
    mode: DamageMode,
    critical: boolean = false
  ): { value: number; rollResult?: DiceRollResult } => {
    if (mode === 'rolled') {
      const rollResult = rollDamageBase(damageBase, critical)
      return { value: rollResult.total, rollResult }
    } else {
      // Set damage mode - use average, double for critical
      let value = getSetDamageByType(damageBase, 'avg')
      if (critical) {
        value *= 2
      }
      return { value }
    }
  }

  // ===========================================
  // PTU Damage Calculation
  // 1. Start with Move's Damage Base
  // 2. Apply STAB (+2 to DB)
  // 3. Get damage from chart (set or rolled)
  // 4. Add Attack stat
  // 5. Subtract Defense stat (minimum 1 damage)
  // 6. Apply type effectiveness (after defenses)
  // ===========================================
  const calculateDamage = (
    damageBase: number,
    attackStat: number,
    defenseStat: number,
    stab: boolean = false,
    effectiveness: number = 1,
    criticalHit: boolean = false
  ): { damage: number; effectiveDB: number; baseDamage: number } => {
    // Step 1-2: Apply STAB to damage base
    let effectiveDB = damageBase
    if (stab) {
      effectiveDB += 2
    }

    // Step 3: Get base damage from chart
    let baseDamage = getSetDamage(effectiveDB)

    // Step 4: Apply critical hit (roll damage dice twice, don't double stat)
    if (criticalHit) {
      baseDamage += getSetDamage(effectiveDB) // Add dice damage again
    }

    // Step 5: Add attack stat
    let totalDamage = baseDamage + attackStat

    // Step 6: Subtract defense stat
    totalDamage = Math.max(1, totalDamage - defenseStat)

    // Step 7: Apply type effectiveness (after defense)
    totalDamage = Math.floor(totalDamage * effectiveness)

    // Minimum 1 damage
    return {
      damage: Math.max(1, totalDamage),
      effectiveDB,
      baseDamage
    }
  }

  // Simplified damage calculation for quick use
  const calculateSetDamage = (
    attackStat: number,
    damageBase: number,
    stab: boolean = false,
    effectiveness: number = 1,
    criticalHit: boolean = false,
    defenseStat: number = 0
  ): number => {
    return calculateDamage(damageBase, attackStat, defenseStat, stab, effectiveness, criticalHit).damage
  }

  return {
    damageBaseChart,
    getSetDamage,
    getSetDamageByType,
    getDamageRoll,
    rollDamageBase,
    getDamageByMode,
    calculateDamage,
    calculateSetDamage
  }
}
