import type { Pokemon, HumanCharacter } from '~/types'

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
