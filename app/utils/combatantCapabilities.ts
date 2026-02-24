import type { Combatant, Pokemon } from '~/types'

/**
 * Shared utility functions for querying combatant movement capabilities.
 * Used by useGridMovement, useElevation, and other composables that need
 * to check whether a combatant can fly, swim, or burrow.
 */

/**
 * Check whether a combatant has Swim capability (swim speed > 0).
 * Pokemon have capabilities.swim; humans default to 0 (no swim).
 */
export function combatantCanSwim(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.swim ?? 0) > 0
  }
  return false
}

/**
 * Check whether a combatant has Burrow capability (burrow speed > 0).
 * Pokemon have capabilities.burrow; humans default to 0 (no burrow).
 */
export function combatantCanBurrow(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.burrow ?? 0) > 0
  }
  return false
}

/**
 * Check whether a combatant has Sky capability (sky speed > 0).
 * Flying Pokemon ignore elevation cost within their Sky speed range.
 */
export function combatantCanFly(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.sky ?? 0) > 0
  }
  return false
}

/**
 * Get a combatant's Sky speed. Returns 0 for non-flying combatants.
 */
export function getSkySpeed(combatant: Combatant): number {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.capabilities?.sky ?? 0
  }
  return 0
}
