/**
 * Living Weapon Service
 *
 * Pure functions for managing wield state within an encounter.
 * No DB access -- API endpoints handle persistence.
 *
 * PTU pp.305-306: Living Weapon capability (Honedge line).
 * Engage = Standard Action, Disengage = Swift Action.
 */

import type { Combatant, Encounter } from '~/types/encounter'
import type { WieldRelationship } from '~/types/combat'
import type { Pokemon, HumanCharacter, SkillRank, Move, PokemonType } from '~/types/character'
import type { MoveFrequency } from '~/types/combat'
import { getLivingWeaponConfig } from '~/utils/combatantCapabilities'
import { LIVING_WEAPON_CONFIG } from '~/constants/livingWeapon'
import type { LivingWeaponConfig } from '~/constants/livingWeapon'
import { areAdjacent } from '~/utils/adjacency'
import { getOverlandSpeed as getOverlandSpeedUtil } from '~/utils/combatantCapabilities'
import {
  computeEquipmentBonuses,
  computeEffectiveEquipment,
  type EquipmentCombatBonuses,
} from '~/utils/equipmentBonuses'
import { calculateEvasion } from '~/utils/damageCalculation'

// ============================================================
// Skill Rank Validation
// ============================================================

const SKILL_RANK_ORDER: readonly SkillRank[] = [
  'Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master'
]

/**
 * Check if a skill rank meets or exceeds a required rank.
 */
export function meetsSkillRequirement(
  actualRank: SkillRank | undefined,
  requiredRank: SkillRank
): boolean {
  const actual = actualRank ?? 'Untrained'
  return SKILL_RANK_ORDER.indexOf(actual) >= SKILL_RANK_ORDER.indexOf(requiredRank)
}

// ============================================================
// Query Functions
// ============================================================

/**
 * Find the wield relationship for a given combatant (as wielder or weapon).
 * Returns null if the combatant is not part of any wield relationship.
 */
export function findWieldRelationship(
  wieldRelationships: WieldRelationship[],
  combatantId: string
): WieldRelationship | null {
  return wieldRelationships.find(
    r => r.wielderId === combatantId || r.weaponId === combatantId
  ) ?? null
}

/**
 * Check if a combatant is currently being wielded as a Living Weapon.
 */
export function isWielded(combatant: Combatant): boolean {
  return combatant.wieldedByTrainerId !== undefined
}

/**
 * Check if a combatant is currently wielding a Living Weapon.
 */
export function isWielding(combatant: Combatant): boolean {
  return combatant.wieldingWeaponId !== undefined
}

/**
 * Get the wielded Pokemon combatant for a trainer.
 * Returns null if the trainer is not wielding.
 */
export function getWieldedWeapon(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  wielderId: string
): Combatant | null {
  const relationship = wieldRelationships.find(
    r => r.wielderId === wielderId
  )
  if (!relationship) return null

  return combatants.find(c => c.id === relationship.weaponId) ?? null
}

/**
 * Get the wielder trainer combatant for a weapon Pokemon.
 * Returns null if the Pokemon is not wielded.
 */
export function getWielder(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  weaponId: string
): Combatant | null {
  const relationship = wieldRelationships.find(
    r => r.weaponId === weaponId
  )
  if (!relationship) return null

  return combatants.find(c => c.id === relationship.wielderId) ?? null
}

// ============================================================
// Engage / Disengage
// ============================================================

/** Result of an engage operation */
export interface EngageResult {
  combatants: Combatant[]
  wieldRelationships: WieldRelationship[]
  wieldRelationship: WieldRelationship
  wielder: Combatant
  weapon: Combatant
}

/** Result of a disengage operation */
export interface DisengageResult {
  combatants: Combatant[]
  wieldRelationships: WieldRelationship[]
  removedRelationship: WieldRelationship
  wielder: Combatant
  weapon: Combatant
}

/**
 * Validate and execute a Living Weapon engage action.
 * Returns new combatant array and wield relationships (immutable).
 *
 * Validation rules:
 * 1. wielder must be a human combatant
 * 2. weapon must be a Pokemon combatant
 * 3. Pokemon must have Living Weapon capability
 * 4. Must be on the same side
 * 5. Trainer must not already be wielding
 * 6. Pokemon must not already be wielded
 * 7. Must be adjacent (if positions are set)
 *
 * NOTE: Per decree-043, Combat Skill Rank gates weapon MOVE ACCESS only,
 * not engagement. Any trainer can engage a Living Weapon regardless of
 * Combat rank. Rank gating deferred to P1 (move injection).
 */
export function engageLivingWeapon(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  wielderId: string,
  weaponId: string
): EngageResult {
  // Find combatants
  const wielder = combatants.find(c => c.id === wielderId)
  if (!wielder) {
    throw createError({ statusCode: 404, message: 'Wielder combatant not found' })
  }

  const weapon = combatants.find(c => c.id === weaponId)
  if (!weapon) {
    throw createError({ statusCode: 404, message: 'Weapon combatant not found' })
  }

  // Rule 1: wielder must be human
  if (wielder.type !== 'human') {
    throw createError({ statusCode: 400, message: 'Only trainers (human combatants) can wield Living Weapons' })
  }

  // Rule 2: weapon must be Pokemon
  if (weapon.type !== 'pokemon') {
    throw createError({ statusCode: 400, message: 'Only Pokemon can be wielded as Living Weapons' })
  }

  // Rule 3: Pokemon must have Living Weapon capability
  const pokemon = weapon.entity as Pokemon
  const weaponConfig = getLivingWeaponConfig(pokemon)
  if (!weaponConfig) {
    throw createError({ statusCode: 400, message: `${pokemon.species} does not have the Living Weapon capability` })
  }

  // Rule 4: same side
  if (wielder.side !== weapon.side) {
    throw createError({ statusCode: 400, message: 'Wielder and weapon must be on the same side' })
  }

  // Rule 5: trainer must not already be wielding
  if (wielder.wieldingWeaponId !== undefined) {
    throw createError({ statusCode: 400, message: 'Trainer is already wielding a Living Weapon' })
  }

  // Rule 6: Pokemon must not already be wielded
  if (weapon.wieldedByTrainerId !== undefined) {
    throw createError({ statusCode: 400, message: 'This Pokemon is already being wielded by another trainer' })
  }

  // Rule 7: adjacency check (only if both have positions)
  if (wielder.position && weapon.position) {
    const adjacent = areAdjacent(
      wielder.position, wielder.tokenSize || 1,
      weapon.position, weapon.tokenSize || 1
    )
    if (!adjacent) {
      throw createError({ statusCode: 400, message: 'Wielder and weapon must be adjacent to engage' })
    }
  }

  // Determine species for the relationship.
  // Validate that species is a known Living Weapon species; default unknown
  // (homebrew) species to 'Honedge' to match reconstruction logic.
  const knownSpecies: WieldRelationship['weaponSpecies'][] = ['Honedge', 'Doublade', 'Aegislash']
  const weaponSpecies: WieldRelationship['weaponSpecies'] = knownSpecies.includes(
    weaponConfig.species as WieldRelationship['weaponSpecies']
  )
    ? (weaponConfig.species as WieldRelationship['weaponSpecies'])
    : 'Honedge'

  // Check if the Pokemon is fainted
  const isFainted = pokemon.currentHp <= 0 ||
    pokemon.statusConditions?.includes('Fainted') === true

  const relationship: WieldRelationship = {
    wielderId,
    weaponId,
    weaponSpecies,
    isFainted,
    movementUsedThisRound: 0,
  }

  // Update combatant flags (immutable)
  const updatedCombatants = combatants.map(c => {
    if (c.id === wielderId) {
      return { ...c, wieldingWeaponId: weaponId }
    }
    if (c.id === weaponId) {
      return { ...c, wieldedByTrainerId: wielderId }
    }
    return c
  })

  const updatedWielder = updatedCombatants.find(c => c.id === wielderId)!
  const updatedWeapon = updatedCombatants.find(c => c.id === weaponId)!

  return {
    combatants: updatedCombatants,
    wieldRelationships: [...wieldRelationships, relationship],
    wieldRelationship: relationship,
    wielder: updatedWielder,
    weapon: updatedWeapon,
  }
}

/**
 * Disengage a Living Weapon wield relationship.
 * Can be called from either the wielder or weapon side.
 * Returns new combatant array and wield relationships (immutable).
 */
export function disengageLivingWeapon(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  combatantId: string
): DisengageResult {
  const relationship = findWieldRelationship(wieldRelationships, combatantId)
  if (!relationship) {
    throw createError({
      statusCode: 400,
      message: 'Combatant is not part of any wield relationship'
    })
  }

  const { wielderId, weaponId } = relationship

  // Clear combatant flags (immutable)
  const updatedCombatants = combatants.map(c => {
    if (c.id === wielderId) {
      const { wieldingWeaponId, ...rest } = c
      return rest as Combatant
    }
    if (c.id === weaponId) {
      const { wieldedByTrainerId, ...rest } = c
      return rest as Combatant
    }
    return c
  })

  const updatedWielder = updatedCombatants.find(c => c.id === wielderId)!
  const updatedWeapon = updatedCombatants.find(c => c.id === weaponId)!

  return {
    combatants: updatedCombatants,
    wieldRelationships: wieldRelationships.filter(
      r => r.wielderId !== relationship.wielderId
    ),
    removedRelationship: relationship,
    wielder: updatedWielder,
    weapon: updatedWeapon,
  }
}

// ============================================================
// State Updates
// ============================================================

/**
 * Update wield relationship fainted state when a Living Weapon Pokemon faints.
 * PTU p.305: fainted Living Weapons are still usable as inanimate equipment.
 * Returns updated wield relationships array (immutable).
 */
export function updateWieldFaintedState(
  wieldRelationships: WieldRelationship[],
  weaponCombatantId: string,
  isFainted: boolean
): WieldRelationship[] {
  return wieldRelationships.map(r => {
    if (r.weaponId === weaponCombatantId) {
      return { ...r, isFainted }
    }
    return r
  })
}

/**
 * Clear wield relationships when a combatant is removed from the encounter.
 * Auto-disengages without action cost.
 * Returns updated combatant array and wield relationships (immutable).
 */
export function clearWieldOnRemoval(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  removedId: string
): { combatants: Combatant[]; wieldRelationships: WieldRelationship[] } {
  const relationship = findWieldRelationship(wieldRelationships, removedId)
  if (!relationship) {
    return { combatants, wieldRelationships }
  }

  const { wielderId, weaponId } = relationship

  // Clear flags on the remaining combatant (the removed one is already gone)
  const updatedCombatants = combatants.map(c => {
    if (c.id === wielderId && wielderId !== removedId) {
      const { wieldingWeaponId, ...rest } = c
      return rest as Combatant
    }
    if (c.id === weaponId && weaponId !== removedId) {
      const { wieldedByTrainerId, ...rest } = c
      return rest as Combatant
    }
    return c
  })

  const updatedRelationships = wieldRelationships.filter(
    r => r.wielderId !== relationship.wielderId
  )

  return { combatants: updatedCombatants, wieldRelationships: updatedRelationships }
}

// ============================================================
// Equipment Bonus Integration (P1)
// ============================================================

/**
 * Get the effective equipment bonuses for a combatant, accounting for
 * Living Weapon equipment overlay when the combatant is wielding one.
 *
 * For human combatants: checks wield relationships and merges the
 * Living Weapon into equipment slots before computing bonuses.
 *
 * For non-human combatants: returns zero bonuses (Pokemon don't use equipment).
 *
 * This is the single integration point for all code paths that need
 * equipment bonuses — it replaces direct computeEquipmentBonuses() calls
 * for combatants in combat with wield relationships.
 */
export function getEffectiveEquipmentBonuses(
  wieldRelationships: WieldRelationship[],
  combatant: Combatant
): EquipmentCombatBonuses {
  if (combatant.type !== 'human') {
    return {
      damageReduction: 0,
      evasionBonus: 0,
      statBonuses: {},
      speedDefaultCS: 0,
      conditionalDR: [],
    }
  }

  const human = combatant.entity as HumanCharacter
  let equipment = human.equipment ?? {}

  // Check for Living Weapon overlay
  const wieldRel = wieldRelationships.find(
    r => r.wielderId === combatant.id
  )
  if (wieldRel) {
    const config = LIVING_WEAPON_CONFIG[wieldRel.weaponSpecies]
    if (config) {
      equipment = computeEffectiveEquipment(equipment, config, wieldRel.isFainted)
    }
  }

  return computeEquipmentBonuses(equipment)
}

/**
 * Recalculate a trainer combatant's equipment-derived bonuses after
 * a wield relationship change (engage or disengage).
 *
 * Updates: evasion values (physical, special, speed).
 * Does NOT update initiative (that requires separate recalculation).
 *
 * Returns a new Combatant with updated evasion values (immutable).
 */
export function refreshCombatantEquipmentBonuses(
  wieldRelationships: WieldRelationship[],
  combatant: Combatant
): Combatant {
  if (combatant.type !== 'human') return combatant

  const human = combatant.entity as HumanCharacter
  const stats = human.stats
  const stages = human.stageModifiers

  // Get effective equipment (accounting for Living Weapon overlay)
  const bonuses = getEffectiveEquipmentBonuses(wieldRelationships, combatant)

  return {
    ...combatant,
    physicalEvasion: calculateEvasion(
      stats.defense || 0,
      stages?.defense || 0,
      (stages?.evasion || 0) + bonuses.evasionBonus,
      bonuses.statBonuses.defense ?? 0
    ),
    specialEvasion: calculateEvasion(
      stats.specialDefense || 0,
      stages?.specialDefense || 0,
      (stages?.evasion || 0) + bonuses.evasionBonus,
      bonuses.statBonuses.specialDefense ?? 0
    ),
    speedEvasion: calculateEvasion(
      stats.speed || 0,
      stages?.speed || 0,
      (stages?.evasion || 0) + bonuses.evasionBonus,
      bonuses.statBonuses.speed ?? 0
    ),
  }
}

// ============================================================
// Weapon Move Injection (P1 — Section I)
// ============================================================

/**
 * Get the weapon moves a Living Weapon gains while wielded,
 * filtered by the wielder's Combat skill rank.
 *
 * PTU p.306: "so long as their wielder qualifies to access them."
 * PTU p.288: Adept Weapon Moves require Adept Combat.
 * PTU p.290: Master Weapon Moves require Master Combat.
 * Per decree-043: Combat Skill Rank gates weapon MOVE ACCESS, not engagement.
 */
export function getGrantedWeaponMoves(
  config: LivingWeaponConfig,
  wielderCombatRank: SkillRank | undefined
): Move[] {
  const rank = wielderCombatRank ?? 'Untrained'

  return config.grantedMoves
    .filter(wm => meetsSkillRequirement(rank, wm.requiredRank))
    .map(wm => ({
      id: `living-weapon-${wm.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: wm.name,
      type: wm.type as PokemonType,
      damageClass: wm.damageClass,
      frequency: wm.frequency as MoveFrequency,
      ac: wm.ac,
      damageBase: wm.damageBase,
      range: wm.range,
      effect: wm.effect,
      keywords: ['Weapon'],
    }))
}

/**
 * Get the effective move list for a Pokemon combatant,
 * including any Living Weapon moves if wielded.
 *
 * PTU p.306: "While used as a Living Weapon, the Pokemon also adds
 * these Moves to its own Move List, so long as their wielder qualifies
 * to access them."
 *
 * Weapon moves are NOT DB-persisted — they are injected at runtime.
 * When fainted, the Pokemon cannot use moves (fainted = no actions),
 * but the moves remain conceptually on the list.
 */
export function getEffectiveMoveList(
  wieldRelationships: WieldRelationship[],
  combatants: Combatant[],
  combatant: Combatant
): Move[] {
  if (combatant.type !== 'pokemon') return []

  const pokemon = combatant.entity as Pokemon
  const baseMoves = pokemon.moves ?? []

  // Check if this Pokemon is currently wielded
  const wieldRel = wieldRelationships.find(
    r => r.weaponId === combatant.id
  )
  if (!wieldRel) return baseMoves

  // Get the wielder's Combat skill rank
  const wielder = combatants.find(c => c.id === wieldRel.wielderId)
  if (!wielder || wielder.type !== 'human') return baseMoves

  const human = wielder.entity as HumanCharacter
  const combatRank = (human.skills?.Combat ?? 'Untrained') as SkillRank

  // Get config and filter moves by wielder qualification
  const config = LIVING_WEAPON_CONFIG[wieldRel.weaponSpecies]
  if (!config) return baseMoves

  const weaponMoves = getGrantedWeaponMoves(config, combatRank)

  // Merge: base moves + weapon moves (avoid duplicates by name)
  const existingNames = new Set(baseMoves.map(m => m.name))
  const newMoves = weaponMoves.filter(m => !existingNames.has(m.name))

  return [...baseMoves, ...newMoves]
}

// ============================================================
// P2: VTT Shared Movement (Section J — PTU p.306)
// ============================================================

/**
 * Sync a wielded Living Weapon's position to its wielder's position.
 * Called after engage, and after any movement by either party.
 *
 * Returns updated combatants array (immutable).
 */
export function syncWeaponPosition(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  wielderId: string
): Combatant[] {
  const relationship = wieldRelationships.find(
    r => r.wielderId === wielderId
  )
  if (!relationship) return combatants

  const wielder = combatants.find(c => c.id === wielderId)
  if (!wielder?.position) return combatants

  return combatants.map(c => {
    if (c.id === relationship.weaponId) {
      return { ...c, position: { ...wielder.position! } }
    }
    return c
  })
}

/**
 * Handle linked movement for a wielded Living Weapon pair.
 * Both combatants move together, and the shared pool is updated.
 *
 * PTU p.306: "the Wielder and the Living Weapon use the Wielder's
 * Movement Speed to shift during each of their turns, and the total
 * amount Shifted during the round cannot exceed the Wielder's Movement Speed."
 *
 * @param combatants - Current combatant array
 * @param wieldRelationships - Current wield relationships
 * @param movingCombatantId - The combatant that initiated the shift
 * @param newPosition - The destination grid position
 * @param movementCost - How many squares of movement were used
 * @returns Updated combatants and wield relationships (immutable)
 */
export function handleLinkedMovement(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  movingCombatantId: string,
  newPosition: { x: number; y: number },
  movementCost: number
): { combatants: Combatant[]; wieldRelationships: WieldRelationship[] } {
  const relationship = wieldRelationships.find(
    r => r.wielderId === movingCombatantId || r.weaponId === movingCombatantId
  )
  if (!relationship) {
    return { combatants, wieldRelationships }
  }

  const partnerId = relationship.wielderId === movingCombatantId
    ? relationship.weaponId
    : relationship.wielderId

  // Update both positions
  const updatedCombatants = combatants.map(c => {
    if (c.id === movingCombatantId || c.id === partnerId) {
      return { ...c, position: { ...newPosition } }
    }
    return c
  })

  // Update shared movement pool
  const updatedRelationships = wieldRelationships.map(r => {
    if (r.wielderId === relationship.wielderId) {
      return {
        ...r,
        movementUsedThisRound: (r.movementUsedThisRound ?? 0) + movementCost,
      }
    }
    return r
  })

  return {
    combatants: updatedCombatants,
    wieldRelationships: updatedRelationships,
  }
}

/**
 * Get the effective movement speed for a combatant, accounting for
 * Living Weapon shared movement pool.
 *
 * For wielded pairs, returns the wielder's speed minus movement
 * already used this round by either party.
 *
 * @returns Remaining movement speed, or -1 if not part of a wield pair
 *          (caller should use normal speed calculation)
 */
export function getWieldedMovementSpeed(
  combatant: Combatant,
  wieldRelationships: WieldRelationship[],
  combatants: Combatant[]
): number | null {
  const relationship = wieldRelationships.find(
    r => r.wielderId === combatant.id || r.weaponId === combatant.id
  )
  if (!relationship) return null

  const wielder = combatants.find(c => c.id === relationship.wielderId)
  if (!wielder) return null

  // Use wielder's overland speed as the shared pool base
  const wielderSpeed = getOverlandSpeedUtil(wielder)
  const remaining = wielderSpeed - (relationship.movementUsedThisRound ?? 0)
  return Math.max(0, remaining)
}

/**
 * Reset shared movement pools for all wield relationships at round start.
 * Called from resetCombatantsForNewRound in turn-helpers.ts.
 *
 * Returns updated wield relationships array (immutable).
 */
export function resetWieldMovementPools(
  wieldRelationships: WieldRelationship[]
): WieldRelationship[] {
  return wieldRelationships.map(r => ({
    ...r,
    movementUsedThisRound: 0,
  }))
}

// ============================================================
// P2: No Guard Ability Suppression (Section K — PTU p.306)
// ============================================================

/**
 * Check if a Pokemon's No Guard ability is currently active.
 * No Guard is suppressed while the Pokemon is wielded as a Living Weapon.
 *
 * PTU p.306: "While Wielded, a Living Weapon cannot benefit from
 * its No Guard Ability."
 */
export function isNoGuardActive(
  combatant: Combatant,
  wieldRelationships: WieldRelationship[]
): boolean {
  if (combatant.type !== 'pokemon') return false

  const pokemon = combatant.entity as Pokemon
  const hasNoGuard = pokemon.abilities?.some(
    (a: { name: string }) => a.name === 'No Guard'
  ) ?? false
  if (!hasNoGuard) return false

  // Suppressed while wielded
  const isCurrentlyWielded = wieldRelationships.some(
    r => r.weaponId === combatant.id
  )
  return !isCurrentlyWielded
}

// ============================================================
// P2: Aegislash Forced Blade Forme (Section L — PTU p.306)
// ============================================================

/**
 * Swap Aegislash between Shield Stance and Sword Stance (Blade forme).
 * Swaps Attack<->Defense and SpAtk<->SpDef in currentStats.
 *
 * Returns a new Pokemon entity (immutable).
 */
export function swapAegislashStance(pokemon: Pokemon): Pokemon {
  const stats = pokemon.currentStats
  return {
    ...pokemon,
    currentStats: {
      ...stats,
      attack: stats.defense,
      defense: stats.attack,
      specialAttack: stats.specialDefense,
      specialDefense: stats.specialAttack,
    },
  }
}

/**
 * Check if an Aegislash is currently in Blade forme (Sword Stance).
 * Heuristic: Blade forme has higher Attack than Defense.
 */
export function isAegislashBladeForm(pokemon: Pokemon): boolean {
  return pokemon.currentStats.attack > pokemon.currentStats.defense
}

// ============================================================
// P2: Weaponize Ability — Free Action Intercept (Section M)
// ============================================================

/**
 * Check if a Pokemon can use Weaponize to intercept for its wielder.
 *
 * PTU p.2874-2878: "While being wielded as a Living Weapon and being
 * actively Commanded as a Pokemon, the user may Intercept for its
 * Wielder as a Free Action."
 *
 * Requirements:
 * 1. The Pokemon has the Weaponize ability
 * 2. The Pokemon is currently wielded as a Living Weapon
 * 3. The Pokemon is NOT fainted (must be "actively commanded")
 */
export function canUseWeaponize(
  combatant: Combatant,
  wieldRelationships: WieldRelationship[]
): boolean {
  if (combatant.type !== 'pokemon') return false

  const pokemon = combatant.entity as Pokemon
  const hasWeaponize = pokemon.abilities?.some(
    (a: { name: string }) => a.name === 'Weaponize'
  ) ?? false
  if (!hasWeaponize) return false

  // Must be wielded
  const relationship = wieldRelationships.find(
    r => r.weaponId === combatant.id
  )
  if (!relationship) return false

  // Must not be fainted (PTU: "actively Commanded")
  if (relationship.isFainted) return false

  return true
}

// ============================================================
// P2: Soulstealer Ability — Heal on Faint/Kill (Section N)
// ============================================================

/**
 * Check if Soulstealer should trigger after a faint.
 *
 * PTU p.2417-2423:
 * - Scene frequency, Free Action
 * - Trigger: the user's attack causes a foe to Faint
 * - Effect: remove 1 Injury + heal 25% max HP
 * - If the attack killed: full heal + remove all Injuries
 *
 * Returns trigger info if Soulstealer should fire, null otherwise.
 */
export function checkSoulstealer(
  attacker: Combatant,
  targetFainted: boolean
): { triggered: boolean; isKill: boolean } | null {
  if (!targetFainted) return null
  if (attacker.type !== 'pokemon') return null

  const pokemon = attacker.entity as Pokemon
  const hasSoulstealer = pokemon.abilities?.some(
    (a: { name: string }) => a.name === 'Soulstealer'
  ) ?? false
  if (!hasSoulstealer) return null

  // Kill detection is deferred to GM input (PTU kill rules are
  // complex and GM-adjudicated). For now, all faints are non-kill.
  return { triggered: true, isKill: false }
}

/**
 * Apply Soulstealer healing to the attacker.
 * - Faint (non-kill): remove 1 Injury + heal 25% max HP
 * - Kill: remove all Injuries + full heal
 *
 * Mutates the combatant's entity in place (follows existing
 * damage.post.ts mutation pattern).
 *
 * Returns info about the healing applied.
 */
export function applySoulstealerHealing(
  combatant: Combatant,
  isKill: boolean
): { hpHealed: number; injuriesRemoved: number } {
  const entity = combatant.entity
  const maxHp = entity.maxHp

  if (isKill) {
    const hpHealed = maxHp - entity.currentHp
    const injuriesRemoved = entity.injuries || 0
    entity.currentHp = maxHp
    entity.injuries = 0
    return { hpHealed, injuriesRemoved }
  } else {
    const healAmount = Math.floor(maxHp * 0.25)
    const hpHealed = Math.min(healAmount, maxHp - entity.currentHp)
    entity.currentHp = Math.min(maxHp, entity.currentHp + healAmount)
    const injuriesRemoved = entity.injuries > 0 ? 1 : 0
    entity.injuries = Math.max(0, (entity.injuries || 0) - 1)
    return { hpHealed, injuriesRemoved }
  }
}
