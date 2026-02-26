/**
 * Combat side relationship utilities.
 *
 * Determines whether two combatants are enemies based on their side assignments.
 * PTU has three sides: 'players', 'allies', and 'enemies'.
 * 'players' and 'allies' are friendly to each other; 'enemies' opposes both.
 */

import type { CombatSide } from '~/types'

/**
 * Determine if two combat sides are hostile to each other.
 *
 * 'players' and 'allies' are friendly to each other.
 * 'enemies' is hostile to both 'players' and 'allies'.
 * Same side is never hostile.
 *
 * @param sideA - First combatant's side
 * @param sideB - Second combatant's side
 * @returns true if the sides are enemies
 */
export function isEnemySide(sideA: CombatSide, sideB: CombatSide): boolean {
  if (sideA === sideB) return false
  if (
    (sideA === 'players' || sideA === 'allies') &&
    (sideB === 'players' || sideB === 'allies')
  ) {
    return false
  }
  return true
}
