/**
 * PTU 1.05 Type-Based Status Condition Immunities
 *
 * PTU p.239: Certain types grant immunity to specific status conditions.
 * Extracted as a shared utility for use by both server (status.post.ts)
 * and client (StatusConditionsModal.vue, useTypeChart.ts).
 *
 * Per decree-012: server enforces immunities by default, with GM override flag.
 */
import type { StatusCondition } from '~/types'

/**
 * Map of Pokemon types to the status conditions they are immune to.
 * PTU p.239:
 * - Electric: immune to Paralysis
 * - Fire: immune to Burn
 * - Ghost: immune to Stuck, Trapped
 * - Ice: immune to Frozen
 * - Poison: immune to Poison (Poisoned, Badly Poisoned)
 * - Steel: immune to Poison (Poisoned, Badly Poisoned)
 */
export const TYPE_STATUS_IMMUNITIES: Readonly<Record<string, readonly StatusCondition[]>> = {
  Electric: ['Paralyzed'],
  Fire: ['Burned'],
  Ghost: ['Stuck', 'Trapped'],
  Ice: ['Frozen'],
  Poison: ['Poisoned', 'Badly Poisoned'],
  Steel: ['Poisoned', 'Badly Poisoned']
}

/**
 * Check if a set of types grants immunity to a specific status condition.
 *
 * @param types - The entity's types (e.g., ['Fire', 'Flying'])
 * @param status - The status condition to check (e.g., 'Burned')
 * @returns true if any of the types grants immunity to the status
 */
export function isImmuneToStatus(types: string[], status: StatusCondition): boolean {
  for (const type of types) {
    const immunities = TYPE_STATUS_IMMUNITIES[type]
    if (immunities && immunities.includes(status)) {
      return true
    }
  }
  return false
}

/**
 * Get the type that grants immunity to a status condition for a given entity.
 * Returns the first matching immune type, or null if not immune.
 *
 * Useful for generating informative error messages (e.g., "Fire-type Pokemon are immune to Burn").
 */
export function getImmuneType(types: string[], status: StatusCondition): string | null {
  for (const type of types) {
    const immunities = TYPE_STATUS_IMMUNITIES[type]
    if (immunities && immunities.includes(status)) {
      return type
    }
  }
  return null
}

/**
 * Check a list of statuses against an entity's types and return immune ones.
 * Returns an array of { status, immuneType } pairs for any statuses
 * the entity is immune to.
 */
export function findImmuneStatuses(
  types: string[],
  statuses: StatusCondition[]
): Array<{ status: StatusCondition; immuneType: string }> {
  const immune: Array<{ status: StatusCondition; immuneType: string }> = []
  for (const status of statuses) {
    const immuneType = getImmuneType(types, status)
    if (immuneType) {
      immune.push({ status, immuneType })
    }
  }
  return immune
}
