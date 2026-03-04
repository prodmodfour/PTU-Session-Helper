/**
 * Living Weapon Movement Service
 *
 * Shared movement pool, position sync, and speed calculation
 * for Living Weapon wield pairs.
 *
 * PTU p.306: "the Wielder and the Living Weapon use the Wielder's
 * Movement Speed to shift during each of their turns, and the total
 * amount Shifted during the round cannot exceed the Wielder's Movement Speed."
 *
 * Extracted from living-weapon.service.ts for file size compliance (C1).
 */

import type { Combatant } from '~/types/encounter'
import type { WieldRelationship } from '~/types/combat'
import { getOverlandSpeed as getOverlandSpeedUtil } from '~/utils/combatantCapabilities'
import { applyMovementModifiers } from '~/utils/movementModifiers'

// ============================================================
// P2: VTT Shared Movement (Section J -- PTU p.306)
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
 * Living Weapon shared movement pool and movement modifiers.
 *
 * For wielded pairs, returns the wielder's modified speed minus movement
 * already used this round by either party.
 *
 * Movement modifiers applied (rules-MEDIUM-002):
 * - Slowed: halve movement speed
 * - Stuck: movement speed 0
 * - Speed CS: additive bonus/penalty
 * - Sprint: +50% movement speed
 *
 * @returns Remaining movement speed, or null if not part of a wield pair
 *          (caller should use normal speed calculation)
 */
export function getWieldedMovementSpeed(
  combatant: Combatant,
  wieldRelationships: WieldRelationship[],
  combatants: Combatant[],
  weather?: string | null
): number | null {
  const relationship = wieldRelationships.find(
    r => r.wielderId === combatant.id || r.weaponId === combatant.id
  )
  if (!relationship) return null

  const wielder = combatants.find(c => c.id === relationship.wielderId)
  if (!wielder) return null

  // Use wielder's overland speed as the shared pool base,
  // then apply movement modifiers (Slowed, Stuck, Speed CS, Sprint)
  const baseSpeed = getOverlandSpeedUtil(wielder)
  const modifiedSpeed = applyMovementModifiers(wielder, baseSpeed, weather)
  const remaining = modifiedSpeed - (relationship.movementUsedThisRound ?? 0)
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
