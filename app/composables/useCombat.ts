import type { Combatant, Pokemon, HumanCharacter, StageModifiers, Move, Stats, PokemonType, DamageMode } from '~/types'
import { roll, rollCritical, type DiceRollResult } from '~/utils/diceRoller'

// PTU 1.05 combat calculations and utilities
export function useCombat() {
  // ===========================================
  // PTU Combat Stage Multipliers
  // Positive stages: +20% per stage
  // Negative stages: -10% per stage
  // ===========================================
  const stageMultipliers: Record<number, number> = {
    [-6]: 0.4,
    [-5]: 0.5,
    [-4]: 0.6,
    [-3]: 0.7,
    [-2]: 0.8,
    [-1]: 0.9,
    [0]: 1.0,
    [1]: 1.2,
    [2]: 1.4,
    [3]: 1.6,
    [4]: 1.8,
    [5]: 2.0,
    [6]: 2.2
  }

  // Apply stage modifier to a stat
  const applyStageModifier = (baseStat: number, stage: number): number => {
    const clampedStage = Math.max(-6, Math.min(6, stage))
    const multiplier = stageMultipliers[clampedStage]
    return Math.floor(baseStat * multiplier)
  }

  // ===========================================
  // PTU HP Calculation
  // Pokemon HP = Level + (HP stat × 3) + 10
  // Trainer HP = Level × 2 + (HP stat × 3) + 10
  // ===========================================
  const calculatePokemonMaxHP = (level: number, hpStat: number): number => {
    return level + (hpStat * 3) + 10
  }

  const calculateTrainerMaxHP = (level: number, hpStat: number): number => {
    return (level * 2) + (hpStat * 3) + 10
  }

  // ===========================================
  // PTU Evasion Calculation
  // Physical Evasion = floor(Defense / 5), max +6
  // Special Evasion = floor(SpDef / 5), max +6
  // Speed Evasion = floor(Speed / 5), max +6
  // ===========================================
  const calculateEvasion = (stat: number, combatStages: number = 0, evasionBonus: number = 0): number => {
    const statEvasion = Math.min(6, Math.floor(applyStageModifier(stat, combatStages) / 5))
    // Bonus evasion from moves/effects stacks on top (PTU 07-combat.md:648-653)
    // Negative evasion can erase but not go below 0
    return Math.max(0, statEvasion + evasionBonus)
  }

  const calculatePhysicalEvasion = (defense: number, defenseStages: number = 0, evasionBonus: number = 0): number => {
    return calculateEvasion(defense, defenseStages, evasionBonus)
  }

  const calculateSpecialEvasion = (spDef: number, spDefStages: number = 0, evasionBonus: number = 0): number => {
    return calculateEvasion(spDef, spDefStages, evasionBonus)
  }

  const calculateSpeedEvasion = (speed: number, speedStages: number = 0, evasionBonus: number = 0): number => {
    return calculateEvasion(speed, speedStages, evasionBonus)
  }

  // ===========================================
  // PTU Initiative
  // Initiative = Modified Speed stat + bonuses
  // ===========================================
  const calculateInitiative = (entity: Pokemon | HumanCharacter, bonus: number = 0): number => {
    let speed: number
    let stages: number = 0

    if ('species' in entity) {
      // Pokemon
      speed = entity.currentStats.speed
      stages = entity.stageModifiers.speed
    } else {
      // Human
      speed = entity.stats.speed
      stages = entity.stageModifiers.speed
    }

    const modifiedSpeed = applyStageModifier(speed, stages)
    return modifiedSpeed + bonus
  }

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

  // ===========================================
  // PTU Type Effectiveness
  // Super Effective: ×1.5
  // Double Super Effective: ×2
  // Triple Super Effective: ×3
  // Resisted: ×0.5
  // Double Resisted: ×0.25
  // Triple Resisted: ×0.125
  // Immune: ×0
  // ===========================================
  const typeEffectiveness: Record<string, Record<string, number>> = {
    Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
    Fire: { Fire: 0.5, Water: 0.5, Grass: 1.5, Ice: 1.5, Bug: 1.5, Rock: 0.5, Dragon: 0.5, Steel: 1.5 },
    Water: { Fire: 1.5, Water: 0.5, Grass: 0.5, Ground: 1.5, Rock: 1.5, Dragon: 0.5 },
    Electric: { Water: 1.5, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 1.5, Dragon: 0.5 },
    Grass: { Fire: 0.5, Water: 1.5, Grass: 0.5, Poison: 0.5, Ground: 1.5, Flying: 0.5, Bug: 0.5, Rock: 1.5, Dragon: 0.5, Steel: 0.5 },
    Ice: { Fire: 0.5, Water: 0.5, Grass: 1.5, Ice: 0.5, Ground: 1.5, Flying: 1.5, Dragon: 1.5, Steel: 0.5 },
    Fighting: { Normal: 1.5, Ice: 1.5, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 1.5, Ghost: 0, Dark: 1.5, Steel: 1.5, Fairy: 0.5 },
    Poison: { Grass: 1.5, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 1.5 },
    Ground: { Fire: 1.5, Electric: 1.5, Grass: 0.5, Poison: 1.5, Flying: 0, Bug: 0.5, Rock: 1.5, Steel: 1.5 },
    Flying: { Electric: 0.5, Grass: 1.5, Fighting: 1.5, Bug: 1.5, Rock: 0.5, Steel: 0.5 },
    Psychic: { Fighting: 1.5, Poison: 1.5, Psychic: 0.5, Dark: 0, Steel: 0.5 },
    Bug: { Fire: 0.5, Grass: 1.5, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 1.5, Ghost: 0.5, Dark: 1.5, Steel: 0.5, Fairy: 0.5 },
    Rock: { Fire: 1.5, Ice: 1.5, Fighting: 0.5, Ground: 0.5, Flying: 1.5, Bug: 1.5, Steel: 0.5 },
    Ghost: { Normal: 0, Psychic: 1.5, Ghost: 1.5, Dark: 0.5 },
    Dragon: { Dragon: 1.5, Steel: 0.5, Fairy: 0 },
    Dark: { Fighting: 0.5, Psychic: 1.5, Ghost: 1.5, Dark: 0.5, Fairy: 0.5 },
    Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 1.5, Rock: 1.5, Steel: 0.5, Fairy: 1.5 },
    Fairy: { Fire: 0.5, Fighting: 1.5, Poison: 0.5, Dragon: 1.5, Dark: 1.5, Steel: 0.5 }
  }

  // Get type effectiveness multiplier
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

  // Get effectiveness description
  const getEffectivenessDescription = (effectiveness: number): string => {
    if (effectiveness === 0) return 'Immune'
    if (effectiveness <= 0.25) return 'Doubly Resisted'
    if (effectiveness < 1) return 'Resisted'
    if (effectiveness >= 2) return 'Doubly Super Effective'
    if (effectiveness > 1) return 'Super Effective'
    return 'Neutral'
  }

  // ===========================================
  // PTU Type Immunities
  // ===========================================
  const typeImmunities: Record<string, string[]> = {
    Electric: ['Paralyzed'],
    Fire: ['Burned'],
    Ghost: ['Stuck', 'Trapped'],
    Grass: [], // Immune to Powder moves (handled separately)
    Ice: ['Frozen'],
    Poison: ['Poisoned', 'Badly Poisoned'],
    Steel: ['Poisoned', 'Badly Poisoned']
  }

  // Check if type grants immunity to status
  const isImmuneToStatus = (types: string[], status: string): boolean => {
    for (const type of types) {
      if (typeImmunities[type]?.includes(status)) {
        return true
      }
    }
    return false
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
  const getHealthStatus = (percentage: number): 'healthy' | 'warning' | 'critical' | 'fainted' => {
    if (percentage <= 0) return 'fainted'
    if (percentage > 50) return 'healthy'
    if (percentage > 25) return 'warning'
    return 'critical'
  }

  // ===========================================
  // PTU Injury System
  // Injuries occur at HP markers: 50%, 0%, -50%, -100%
  // Or from Massive Damage (50%+ of max HP in one hit)
  // ===========================================
  const checkForInjury = (
    previousHp: number,
    currentHp: number,
    maxHp: number,
    damageTaken: number
  ): { injured: boolean; reason: string } => {
    // Check for Massive Damage (50%+ of max HP in one hit)
    if (damageTaken >= maxHp * 0.5) {
      return { injured: true, reason: 'Massive Damage' }
    }

    // Check if crossed an HP marker
    const previousPercent = (previousHp / maxHp) * 100
    const currentPercent = (currentHp / maxHp) * 100

    const markers = [50, 0, -50, -100]
    for (const marker of markers) {
      if (previousPercent > marker && currentPercent <= marker) {
        return { injured: true, reason: `Crossed ${marker}% HP marker` }
      }
    }

    return { injured: false, reason: '' }
  }

  // Calculate XP gain (PTU formula)
  const calculateXPGain = (defeatedLevel: number, participantCount: number): number => {
    const baseXP = defeatedLevel * 10
    return Math.floor(baseXP / participantCount)
  }

  // Check if entity can act (not fainted/frozen/asleep)
  const canAct = (entity: Pokemon | HumanCharacter): boolean => {
    const currentHp = entity.currentHp

    if (currentHp <= 0) return false

    const conditions = entity.statusConditions
    if (conditions.includes('Frozen') || conditions.includes('Asleep')) {
      return false
    }

    return true
  }

  // ===========================================
  // PTU Accuracy Check
  // Roll d20 >= AC to hit
  // AC = Move's Base AC + Target's Evasion - Attacker's Accuracy modifiers
  // Natural 1 always misses, Natural 20 always hits
  // ===========================================
  const getAccuracyThreshold = (
    baseAC: number,
    attackerAccuracy: number,
    defenderEvasion: number
  ): number => {
    // Modified AC = Base AC - Accuracy Stages + Evasion (max +9 from evasion)
    const effectiveEvasion = Math.min(9, defenderEvasion)
    return Math.max(1, baseAC - attackerAccuracy + effectiveEvasion)
  }

  // ===========================================
  // PTU Action Points
  // Max AP = 5 + floor(TrainerLevel / 5)
  // ===========================================
  const calculateMaxActionPoints = (trainerLevel: number): number => {
    return 5 + Math.floor(trainerLevel / 5)
  }

  // ===========================================
  // PTU Movement from Speed Combat Stages
  // Bonus/penalty to movement = floor(Speed CS / 2)
  // Minimum movement is 2
  // ===========================================
  const calculateMovementModifier = (speedCombatStages: number): number => {
    return Math.floor(speedCombatStages / 2)
  }

  const calculateEffectiveMovement = (baseMovement: number, speedCombatStages: number): number => {
    const modifier = calculateMovementModifier(speedCombatStages)
    return Math.max(2, baseMovement + modifier)
  }

  return {
    // Stage modifiers
    stageMultipliers,
    applyStageModifier,

    // HP calculations
    calculatePokemonMaxHP,
    calculateTrainerMaxHP,

    // Evasion calculations
    calculateEvasion,
    calculatePhysicalEvasion,
    calculateSpecialEvasion,
    calculateSpeedEvasion,

    // Initiative
    calculateInitiative,

    // Damage calculations
    damageBaseChart,
    getSetDamage,
    getSetDamageByType,
    getDamageRoll,
    rollDamageBase,
    getDamageByMode,
    calculateDamage,
    calculateSetDamage,

    // Type effectiveness
    typeEffectiveness,
    getTypeEffectiveness,
    getEffectivenessDescription,
    typeImmunities,
    isImmuneToStatus,
    hasSTAB,

    // Health utilities
    getHealthPercentage,
    getHealthStatus,

    // Injury system
    checkForInjury,

    // XP
    calculateXPGain,

    // Action utilities
    canAct,
    getAccuracyThreshold,

    // Action Points
    calculateMaxActionPoints,

    // Movement
    calculateMovementModifier,
    calculateEffectiveMovement
  }
}
