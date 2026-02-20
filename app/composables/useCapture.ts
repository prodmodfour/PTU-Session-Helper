import type { StatusCondition } from '~/types'
import { calculateCaptureRate, getCaptureDescription } from '~/utils/captureRate'

export interface CaptureRateData {
  species: string
  level: number
  currentHp: number
  maxHp: number
  captureRate: number
  difficulty: string
  canBeCaptured: boolean
  hpPercentage: number
  breakdown: {
    base: number
    levelModifier: number
    hpModifier: number
    evolutionModifier: number
    shinyModifier: number
    legendaryModifier: number
    statusModifier: number
    injuryModifier: number
    stuckModifier: number
    slowModifier: number
  }
}

export interface CaptureAttemptResult {
  captured: boolean
  roll: number
  modifiedRoll: number
  captureRate: number
  effectiveCaptureRate: number
  naturalHundred: boolean
  criticalHit: boolean
  trainerLevel: number
  modifiers: number
  difficulty: string
  breakdown: CaptureRateData['breakdown']
  pokemon: {
    id: string
    species: string
    level: number
    currentHp: number
    maxHp: number
    hpPercentage: number
  }
  trainer: {
    id: string
    name: string
    level: number
  }
  reason?: string
}

export function useCapture() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)

  /**
   * Get the capture rate for a Pokemon by ID
   */
  async function getCaptureRate(pokemonId: string): Promise<CaptureRateData | null> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: CaptureRateData }>('/api/capture/rate', {
        method: 'POST',
        body: { pokemonId }
      })

      if (response.success) {
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e.message || 'Failed to get capture rate'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Calculate capture rate from provided data (no API call)
   */
  function calculateCaptureRateLocal(params: {
    level: number
    currentHp: number
    maxHp: number
    evolutionStage?: number
    maxEvolutionStage?: number
    statusConditions?: StatusCondition[]
    injuries?: number
    isShiny?: boolean
    isLegendary?: boolean
  }): CaptureRateData {
    const result = calculateCaptureRate({
      level: params.level,
      currentHp: params.currentHp,
      maxHp: params.maxHp,
      evolutionStage: params.evolutionStage ?? 1,
      maxEvolutionStage: params.maxEvolutionStage ?? 3,
      statusConditions: params.statusConditions ?? [],
      injuries: params.injuries ?? 0,
      isShiny: params.isShiny ?? false,
      isLegendary: params.isLegendary ?? false
    })

    return {
      species: '',
      level: params.level,
      currentHp: params.currentHp,
      maxHp: params.maxHp,
      captureRate: result.captureRate,
      difficulty: getCaptureDescription(result.captureRate),
      canBeCaptured: result.canBeCaptured,
      hpPercentage: Math.round(result.hpPercentage),
      breakdown: result.breakdown
    }
  }

  /**
   * Attempt to capture a Pokemon.
   * Per PTU Core (p227): Throwing a Poke Ball is a Standard Action.
   * When encounterContext is provided, consumes the trainer's Standard Action.
   */
  async function attemptCapture(params: {
    pokemonId: string
    trainerId: string
    accuracyRoll?: number
    modifiers?: number
    pokeBallType?: string
    encounterContext?: {
      encounterId: string
      trainerCombatantId: string
    }
  }): Promise<CaptureAttemptResult | null> {
    loading.value = true
    error.value = null
    warning.value = null

    try {
      const response = await $fetch<{ success: boolean; data: CaptureAttemptResult }>('/api/capture/attempt', {
        method: 'POST',
        body: {
          pokemonId: params.pokemonId,
          trainerId: params.trainerId,
          accuracyRoll: params.accuracyRoll,
          modifiers: params.modifiers,
          pokeBallType: params.pokeBallType
        }
      })

      if (response.success) {
        // Consume the trainer's Standard Action if in an encounter
        if (params.encounterContext) {
          const { encounterId, trainerCombatantId } = params.encounterContext
          try {
            await $fetch(`/api/encounters/${encounterId}/action`, {
              method: 'POST',
              body: {
                combatantId: trainerCombatantId,
                actionType: 'standard'
              }
            })
          } catch (actionError: any) {
            warning.value = 'Capture succeeded but standard action was not consumed — please adjust action economy manually'
          }
        }
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e.message || 'Failed to attempt capture'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Roll accuracy check for throwing a Poke Ball
   * AC 6, range = 4 + Athletics rank
   */
  function rollAccuracyCheck(): { roll: number; isNat20: boolean; total: number } {
    const roll = Math.floor(Math.random() * 20) + 1
    return {
      roll,
      isNat20: roll === 20,
      total: roll // Add trainer's accuracy modifiers if needed
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    warning: readonly(warning),
    getCaptureRate,
    calculateCaptureRateLocal,
    attemptCapture,
    rollAccuracyCheck
  }
}
