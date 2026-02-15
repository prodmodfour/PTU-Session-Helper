/**
 * Combatant Service
 * Handles combat mechanics: damage calculation, healing, status conditions, and stage modifiers
 */

import type { StatusCondition, StageModifiers, Combatant } from '~/types'

// ============================================
// DAMAGE CALCULATION
// ============================================

export interface DamageResult {
  finalDamage: number
  tempHpAbsorbed: number
  hpDamage: number
  newHp: number
  newTempHp: number
  injuryGained: boolean
  newInjuries: number
  fainted: boolean
}

/**
 * Calculate damage with PTU mechanics
 * - Temporary HP absorbs damage first
 * - Massive Damage rule: 50%+ of max HP = injury
 */
export function calculateDamage(
  damage: number,
  currentHp: number,
  maxHp: number,
  temporaryHp: number,
  currentInjuries: number
): DamageResult {
  let remainingDamage = damage
  let tempHpAbsorbed = 0

  // Temporary HP absorbs damage first
  if (temporaryHp > 0) {
    tempHpAbsorbed = Math.min(temporaryHp, remainingDamage)
    remainingDamage -= tempHpAbsorbed
  }

  const newTempHp = temporaryHp - tempHpAbsorbed
  const hpDamage = remainingDamage
  const newHp = Math.max(0, currentHp - hpDamage)

  // PTU Massive Damage rule: 50%+ of max HP in one hit = injury
  // Only HP damage counts, not temp HP damage
  const injuryGained = hpDamage >= maxHp / 2

  const newInjuries = injuryGained ? currentInjuries + 1 : currentInjuries
  const fainted = newHp === 0

  return {
    finalDamage: damage,
    tempHpAbsorbed,
    hpDamage,
    newHp,
    newTempHp,
    injuryGained,
    newInjuries,
    fainted
  }
}

/**
 * Apply damage to a combatant's entity, updating HP, temp HP, injuries, and status
 */
export function applyDamageToEntity(
  combatant: Combatant,
  damageResult: DamageResult
): void {
  const entity = combatant.entity

  entity.currentHp = damageResult.newHp
  entity.temporaryHp = damageResult.newTempHp
  entity.injuries = damageResult.newInjuries

  // PTU p248: fainting clears all Persistent and Volatile status conditions
  if (damageResult.fainted) {
    entity.statusConditions = ['Fainted']
  }
}

// ============================================
// HEALING
// ============================================

export interface HealResult {
  hpHealed?: number
  tempHpGained?: number
  injuriesHealed?: number
  newHp: number
  newTempHp: number
  newInjuries: number
  faintedRemoved: boolean
}

export interface HealOptions {
  amount?: number      // HP to heal
  tempHp?: number      // Temp HP to grant
  healInjuries?: number // Injuries to heal
}

/**
 * Apply healing to a combatant's entity
 */
export function applyHealingToEntity(
  combatant: Combatant,
  options: HealOptions
): HealResult {
  const entity = combatant.entity
  const result: HealResult = {
    newHp: entity.currentHp,
    newTempHp: entity.temporaryHp || 0,
    newInjuries: entity.injuries || 0,
    faintedRemoved: false
  }

  // Heal HP (capped at max HP)
  if (options.amount !== undefined && options.amount > 0) {
    const maxHp = entity.maxHp
    const previousHp = entity.currentHp
    const newHp = Math.min(maxHp, previousHp + options.amount)
    entity.currentHp = newHp
    result.hpHealed = newHp - previousHp
    result.newHp = newHp

    // Remove Fainted status if healed from 0 HP
    if (previousHp === 0 && newHp > 0) {
      entity.statusConditions = (entity.statusConditions || []).filter(
        (s: StatusCondition) => s !== 'Fainted'
      )
      result.faintedRemoved = true
    }
  }

  // Grant Temporary HP (stacks with existing)
  if (options.tempHp !== undefined && options.tempHp > 0) {
    const previousTempHp = entity.temporaryHp || 0
    const newTempHp = previousTempHp + options.tempHp
    entity.temporaryHp = newTempHp
    result.tempHpGained = options.tempHp
    result.newTempHp = newTempHp
  }

  // Heal injuries (can't go below 0)
  if (options.healInjuries !== undefined && options.healInjuries > 0) {
    const previousInjuries = entity.injuries || 0
    const newInjuries = Math.max(0, previousInjuries - options.healInjuries)
    entity.injuries = newInjuries
    result.injuriesHealed = previousInjuries - newInjuries
    result.newInjuries = newInjuries
  }

  return result
}

// ============================================
// STATUS CONDITIONS
// ============================================

export const VALID_STATUS_CONDITIONS: StatusCondition[] = [
  'Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned',
  'Asleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed',
  'Disabled', 'Encored', 'Taunted', 'Tormented',
  'Stuck', 'Slowed', 'Trapped', 'Enraged', 'Suppressed', 'Fainted',
  'Tripped', 'Vulnerable'
]

export interface StatusChangeResult {
  added: StatusCondition[]
  removed: StatusCondition[]
  current: StatusCondition[]
}

/**
 * Update status conditions on a combatant's entity
 */
export function updateStatusConditions(
  combatant: Combatant,
  addStatuses: StatusCondition[],
  removeStatuses: StatusCondition[]
): StatusChangeResult {
  const entity = combatant.entity
  let currentStatuses: StatusCondition[] = entity.statusConditions || []

  // Remove statuses first
  const actuallyRemoved = removeStatuses.filter(s => currentStatuses.includes(s))
  currentStatuses = currentStatuses.filter(s => !removeStatuses.includes(s))

  // Add new statuses (avoid duplicates)
  const actuallyAdded: StatusCondition[] = []
  for (const status of addStatuses) {
    if (!currentStatuses.includes(status)) {
      currentStatuses.push(status)
      actuallyAdded.push(status)
    }
  }

  entity.statusConditions = currentStatuses

  return {
    added: actuallyAdded,
    removed: actuallyRemoved,
    current: currentStatuses
  }
}

/**
 * Validate status conditions array
 * @throws H3Error if any status is invalid
 */
export function validateStatusConditions(statuses: StatusCondition[]): void {
  for (const status of statuses) {
    if (!VALID_STATUS_CONDITIONS.includes(status)) {
      throw createError({
        statusCode: 400,
        message: `Invalid status condition: ${status}`
      })
    }
  }
}

// ============================================
// STAGE MODIFIERS
// ============================================

export type StageStat = keyof StageModifiers

export const VALID_STATS: StageStat[] = [
  'attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy', 'evasion'
]

// PTU stage modifiers are clamped to -6 to +6
const MIN_STAGE = -6
const MAX_STAGE = 6

export interface StageChangeResult {
  changes: Record<string, { previous: number; change: number; current: number }>
  currentStages: StageModifiers
}

/**
 * Clamp a stage value to valid range
 */
function clampStage(value: number): number {
  return Math.max(MIN_STAGE, Math.min(MAX_STAGE, value))
}

/**
 * Create default stage modifiers object
 */
function createDefaultStageModifiers(): StageModifiers {
  return {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0
  }
}

/**
 * Update stage modifiers on a combatant's entity
 * @param changes - Object with stat names and delta values (or absolute values if isAbsolute=true)
 * @param isAbsolute - If true, set values directly instead of adding
 */
export function updateStageModifiers(
  combatant: Combatant,
  changes: Record<string, number>,
  isAbsolute: boolean = false
): StageChangeResult {
  const entity = combatant.entity

  // Initialize stage modifiers if not present
  if (!entity.stageModifiers) {
    entity.stageModifiers = createDefaultStageModifiers()
  }

  const appliedChanges: Record<string, { previous: number; change: number; current: number }> = {}

  for (const [stat, value] of Object.entries(changes)) {
    const previousValue = entity.stageModifiers[stat as StageStat] || 0
    let newValue: number

    if (isAbsolute) {
      newValue = clampStage(value)
    } else {
      newValue = clampStage(previousValue + value)
    }

    entity.stageModifiers[stat as StageStat] = newValue
    appliedChanges[stat] = {
      previous: previousValue,
      change: newValue - previousValue,
      current: newValue
    }
  }

  return {
    changes: appliedChanges,
    currentStages: { ...entity.stageModifiers }
  }
}

/**
 * Validate stat names
 * @throws H3Error if any stat is invalid
 */
export function validateStageStats(stats: string[]): void {
  for (const stat of stats) {
    if (!VALID_STATS.includes(stat as StageStat)) {
      throw createError({
        statusCode: 400,
        message: `Invalid stat: ${stat}. Valid stats are: ${VALID_STATS.join(', ')}`
      })
    }
  }
}
