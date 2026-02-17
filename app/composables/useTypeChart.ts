// PTU 1.05 type effectiveness and immunity utilities
import {
  TYPE_CHART,
  getTypeEffectiveness,
  getEffectivenessLabel
} from '~/utils/typeChart'

export function useTypeChart() {
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

  // Check if move gets STAB (Same Type Attack Bonus)
  const hasSTAB = (moveType: string, userTypes: string[]): boolean => {
    return userTypes.includes(moveType)
  }

  return {
    typeEffectiveness: TYPE_CHART,
    getTypeEffectiveness,
    getEffectivenessDescription: getEffectivenessLabel,
    getEffectivenessLabel,
    typeImmunities,
    isImmuneToStatus,
    hasSTAB
  }
}
