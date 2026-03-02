import type { Combatant, Pokemon } from '~/types'
import type { CaptureRateData } from '~/composables/useCapture'

/**
 * Player-side capture composable.
 * Provides capture rate preview and request submission.
 * Does NOT execute capture -- that is GM-only.
 *
 * Uses fetchCaptureRate() for server-side calculation (accurate, includes
 * evolution stage data from SpeciesData) or estimateCaptureRate() as a
 * local fallback when the server call is not possible.
 */
export function usePlayerCapture() {
  const { getCaptureRate, calculateCaptureRateLocal, loading, error } = useCapture()

  /**
   * Fetch capture rate for a target combatant via the server endpoint.
   * The server has access to SpeciesData (evolution stages, legendary status)
   * which produces accurate capture rates.
   */
  const fetchCaptureRate = async (targetCombatant: Combatant): Promise<CaptureRateData | null> => {
    if (targetCombatant.type !== 'pokemon') return null
    const pokemon = targetCombatant.entity as Pokemon
    return getCaptureRate(pokemon.id)
  }

  /**
   * Calculate capture rate locally from combatant data.
   * Falls back to this when the server call is not possible.
   * Uses default evolution stage values since the client-side Pokemon
   * type does not include SpeciesData fields.
   */
  const estimateCaptureRate = (targetCombatant: Combatant): CaptureRateData | null => {
    if (targetCombatant.type !== 'pokemon') return null
    const pokemon = targetCombatant.entity as Pokemon

    return calculateCaptureRateLocal({
      level: pokemon.level,
      currentHp: pokemon.currentHp,
      maxHp: pokemon.maxHp,
      statusConditions: pokemon.statusConditions ?? [],
      injuries: pokemon.injuries ?? 0,
      isShiny: pokemon.shiny ?? false
    })
  }

  return {
    fetchCaptureRate,
    estimateCaptureRate,
    loading: readonly(loading),
    error: readonly(error)
  }
}
