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
  /** True if any injuries were gained from this hit (massive damage OR marker crossings) */
  injuryGained: boolean
  /** True if massive damage rule triggered (single hit >= 50% maxHp) */
  massiveDamageInjury: boolean
  /** Number of HP marker injuries (from crossing 50%, 0%, -50%, -100%, etc.) */
  markerInjuries: number
  /** Which HP thresholds were crossed (e.g., [25, 0] for a 50hp Pokemon crossing 50% and 0%) */
  markersCrossed: number[]
  /** Total new injuries from this hit: massive damage + marker crossings */
  totalNewInjuries: number
  newInjuries: number
  fainted: boolean
}

/**
 * Count HP markers crossed between previousHp and newHp.
 * PTU 07-combat.md:1849-1852 — Markers at 50%, 0%, -50%, -100%, and every -50% below.
 * Uses REAL maxHp (not injury-reduced) per PTU rules (07-combat.md:1872-1876).
 *
 * HP can go negative internally for marker counting, even though the stored
 * value is clamped to 0.
 */
export function countMarkersCrossed(
  previousHp: number,
  newHp: number,
  realMaxHp: number
): { count: number; markers: number[] } {
  const markers: number[] = []
  const fiftyPercent = Math.floor(realMaxHp * 0.5)

  // Safety: don't loop if maxHp is too small to produce meaningful markers
  if (fiftyPercent <= 0) {
    return { count: 0, markers }
  }

  // Generate marker thresholds: 50%, 0%, -50%, -100%, ...
  // Start at 50% of maxHp, descend by 50% steps into negative territory
  let threshold = fiftyPercent
  while (threshold >= newHp) {
    if (previousHp > threshold && newHp <= threshold) {
      markers.push(threshold)
    }
    threshold -= fiftyPercent
    // Safety cap — in extreme cases, don't loop forever
    if (markers.length > 20) break
  }

  return { count: markers.length, markers }
}

/**
 * Calculate damage with PTU mechanics
 * - Temporary HP absorbs damage first
 * - Massive Damage rule: 50%+ of max HP = injury (07-combat.md:1843-1848)
 * - HP Marker crossings: 50%, 0%, -50%, -100%, etc. = 1 injury each (07-combat.md:1849-1856)
 * - newHp is clamped to 0 for storage; unclamped value is used for marker detection
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

  // Unclamped HP for marker detection — PTU allows negative HP for injury tracking
  const unclampedHp = currentHp - hpDamage

  // Clamped HP for storage and display
  const newHp = Math.max(0, unclampedHp)

  // PTU Massive Damage rule: 50%+ of max HP in one hit = 1 injury
  // Only HP damage counts, not temp HP damage
  const massiveDamageInjury = hpDamage >= maxHp / 2

  // HP Marker crossings: each marker crossed = 1 injury
  const { count: markerInjuries, markers: markersCrossed } = countMarkersCrossed(
    currentHp,
    unclampedHp,
    maxHp
  )

  const totalNewInjuries = (massiveDamageInjury ? 1 : 0) + markerInjuries
  const injuryGained = totalNewInjuries > 0
  const newInjuries = currentInjuries + totalNewInjuries
  const fainted = newHp === 0

  return {
    finalDamage: damage,
    tempHpAbsorbed,
    hpDamage,
    newHp,
    newTempHp,
    injuryGained,
    massiveDamageInjury,
    markerInjuries,
    markersCrossed,
    totalNewInjuries,
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
export function createDefaultStageModifiers(): StageModifiers {
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
