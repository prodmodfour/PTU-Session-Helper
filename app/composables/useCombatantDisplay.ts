import type { Combatant, Pokemon, HumanCharacter } from '~/types'

/**
 * Composable for consistent combatant display logic across the application.
 * Consolidates name resolution for Pokemon and Human entities.
 */
export function useCombatantDisplay() {
  /**
   * Get display name for a combatant (Pokemon or Human)
   * For Pokemon: returns nickname if set, otherwise species name
   * For Humans: returns character name
   */
  const getCombatantName = (combatant?: Combatant): string => {
    if (!combatant?.entity) return 'Unknown'

    if (combatant.type === 'pokemon') {
      const pokemon = combatant.entity as Pokemon
      return pokemon.nickname || pokemon.species
    } else {
      const human = combatant.entity as HumanCharacter
      return human.name
    }
  }

  /**
   * Get display name directly from an entity (Pokemon or Human)
   * Useful when you have the entity but not the full combatant wrapper
   */
  const getEntityName = (entity: Pokemon | HumanCharacter, type: 'pokemon' | 'human'): string => {
    if (type === 'pokemon') {
      const pokemon = entity as Pokemon
      return pokemon.nickname || pokemon.species
    } else {
      const human = entity as HumanCharacter
      return human.name
    }
  }

  /**
   * Get first character of combatant name (for avatar fallbacks)
   */
  const getCombatantInitial = (combatant?: Combatant): string => {
    const name = getCombatantName(combatant)
    return name.charAt(0).toUpperCase()
  }

  /**
   * Find a combatant by ID and return its name
   */
  const getCombatantNameById = (combatants: Combatant[], id: string): string => {
    const combatant = combatants.find(c => c.id === id)
    return combatant ? getCombatantName(combatant) : '???'
  }

  return {
    getCombatantName,
    getEntityName,
    getCombatantInitial,
    getCombatantNameById
  }
}
