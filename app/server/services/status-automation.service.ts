/**
 * Status Automation Service
 * Pure functions for tick damage calculation at turn end.
 *
 * PTU 1.05 p.246-247:
 * - Burn/Poison: 1 tick at turn end (took or was prevented from Standard Action)
 * - Badly Poisoned: 5 HP first round, doubles each consecutive round (10, 20, 40...)
 * - Cursed: 2 ticks at turn end ONLY when Standard Action was actually taken (decree-032)
 *
 * Tick = floor(maxHp / 10), minimum 1
 */

import type { Combatant } from '~/types'
import type { StatusCondition } from '~/types/combat'
import type { Pokemon, HumanCharacter } from '~/types/character'

// ============================================
// TYPES
// ============================================

/** Result of automatic tick damage processing */
export interface TickDamageResult {
  combatantId: string
  combatantName: string
  condition: StatusCondition
  damage: number
  /** How the damage was calculated */
  formula: string
  /** Current HP after tick damage */
  newHp: number
  /** Whether any injuries were gained */
  injuryGained: boolean
  /** Whether the combatant fainted from tick damage */
  fainted: boolean
  /** For Badly Poisoned: which round of escalation */
  escalationRound?: number
}

/** Individual tick damage entry before application */
export interface TickDamageEntry {
  condition: StatusCondition
  damage: number
  formula: string
  escalationRound?: number
}

// ============================================
// PURE CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate tick damage (1/10 max HP, rounded down, minimum 1).
 * PTU p.246: "A Tick of Hit Points is equal to 1/10th of a
 * Pokemon or Trainer's Maximum Hit Points."
 */
export function calculateTickDamage(maxHp: number): number {
  return Math.max(1, Math.floor(maxHp / 10))
}

/**
 * Calculate Badly Poisoned damage for a given escalation round.
 * PTU p.247: "loses 5 Hit Points; this amount is doubled each
 * consecutive round (10, 20, 40, etc)."
 *
 * Formula: 5 * 2^(round - 1)
 */
export function calculateBadlyPoisonedDamage(escalationRound: number): number {
  return 5 * Math.pow(2, Math.max(0, escalationRound - 1))
}

/**
 * Determine what tick damage (if any) a combatant takes at end of turn.
 * Returns array of { condition, damage, formula } entries.
 *
 * Burn/Poison: always fires (Standard Action taken or prevented).
 * Badly Poisoned: always fires, escalating damage. Supersedes Poisoned.
 * Cursed: only fires if Standard Action was actually taken (decree-032).
 *
 * @param combatant - The combatant whose turn is ending
 * @param standardActionTaken - Whether the combatant actually used a Standard Action
 *                              (as opposed to being prevented by Freeze/Sleep/etc.)
 */
export function getTickDamageEntries(
  combatant: Combatant,
  standardActionTaken: boolean
): TickDamageEntry[] {
  const entity = combatant.entity
  const statuses: StatusCondition[] = entity.statusConditions || []
  const maxHp = entity.maxHp
  const entries: TickDamageEntry[] = []

  // Skip if fainted (HP = 0 means no status conditions per PTU p.248)
  if (entity.currentHp <= 0) return entries

  const tick = calculateTickDamage(maxHp)
  const hasBadlyPoisoned = statuses.includes('Badly Poisoned')

  // Burn: always fires (took or was prevented from Standard Action)
  if (statuses.includes('Burned')) {
    entries.push({
      condition: 'Burned',
      damage: tick,
      formula: `1/10 max HP (${tick})`
    })
  }

  // Badly Poisoned supersedes Poisoned (E3: no double-tick)
  if (hasBadlyPoisoned) {
    const round = combatant.badlyPoisonedRound || 1
    const damage = calculateBadlyPoisonedDamage(round)
    entries.push({
      condition: 'Badly Poisoned',
      damage,
      formula: `5 x 2^${round - 1} = ${damage} HP (round ${round})`,
      escalationRound: round
    })
  } else if (statuses.includes('Poisoned')) {
    // Poison: always fires (same trigger as Burn)
    entries.push({
      condition: 'Poisoned',
      damage: tick,
      formula: `1/10 max HP (${tick})`
    })
  }

  // Cursed: ONLY fires if Standard Action was actually taken (decree-032)
  if (statuses.includes('Cursed') && standardActionTaken) {
    entries.push({
      condition: 'Cursed',
      damage: tick * 2,
      formula: `2 ticks (${tick * 2})`
    })
  }

  return entries
}

// ============================================
// HELPERS
// ============================================

/**
 * Get display name for a combatant (Pokemon nickname/species or Human name).
 */
export function getCombatantName(combatant: Combatant): string {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (combatant.entity as HumanCharacter).name
}
