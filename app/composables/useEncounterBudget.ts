import {
  calculateEncounterBudget,
  calculateEffectiveEnemyLevels,
  analyzeEncounterBudget,
  calculateEncounterXp
} from '~/utils/encounterBudget'
import type { BudgetCalcInput, BudgetAnalysis } from '~/utils/encounterBudget'

/**
 * Composable wrapping the encounterBudget.ts pure utility for Vue components.
 * Provides reactive access to budget analysis for the active encounter.
 */
export function useEncounterBudget() {
  const encounterStore = useEncounterStore()

  /**
   * Compute budget analysis for the current encounter.
   * Requires knowing the average Pokemon level of the player party.
   * Returns null if no encounter is loaded.
   */
  const analyzeCurrent = (averagePokemonLevel: number): BudgetAnalysis | null => {
    const encounter = encounterStore.encounter
    if (!encounter) return null

    const playerCombatants = encounter.combatants.filter(c => c.side === 'players')
    const enemies = encounter.combatants
      .filter(c => c.side === 'enemies')
      .map(c => ({
        level: c.entity.level,
        isTrainer: c.type === 'human'
      }))

    return analyzeEncounterBudget(
      { averagePokemonLevel, playerCount: playerCombatants.length },
      enemies
    )
  }

  return {
    analyzeCurrent,
    calculateEncounterBudget,
    calculateEffectiveEnemyLevels,
    analyzeEncounterBudget,
    calculateEncounterXp
  }
}
