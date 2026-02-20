import type { StatusCondition } from '~/types'
import { PERSISTENT_CONDITIONS, VOLATILE_CONDITIONS } from '~/constants/statusConditions'

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
    const {
      level,
      currentHp,
      maxHp,
      evolutionStage = 1,
      maxEvolutionStage = 3,
      statusConditions = [],
      injuries = 0,
      isShiny = false,
      isLegendary = false
    } = params

    const canBeCaptured = currentHp > 0
    const hpPercentage = (currentHp / maxHp) * 100

    // Base 100
    const base = 100

    // Level modifier
    const levelModifier = -(level * 2)

    // HP modifier
    let hpModifier = 0
    if (currentHp === 1) {
      hpModifier = 30
    } else if (hpPercentage <= 25) {
      hpModifier = 15
    } else if (hpPercentage <= 50) {
      hpModifier = 0
    } else if (hpPercentage <= 75) {
      hpModifier = -15
    } else {
      hpModifier = -30
    }

    // Evolution modifier
    const evolutionsRemaining = maxEvolutionStage - evolutionStage
    let evolutionModifier = 0
    if (evolutionsRemaining >= 2) {
      evolutionModifier = 10
    } else if (evolutionsRemaining === 0) {
      evolutionModifier = -10
    }

    // Rarity
    const shinyModifier = isShiny ? -10 : 0
    const legendaryModifier = isLegendary ? -30 : 0

    // Status conditions — use canonical lists from constants
    const persistentConditions = PERSISTENT_CONDITIONS
    const volatileConditions = VOLATILE_CONDITIONS

    // Poisoned and Badly Poisoned are variants of the same affliction (PTU p.246);
    // only one should contribute +10 to capture rate, never both.
    let statusModifier = 0
    let stuckModifier = 0
    let slowModifier = 0
    let hasPoisonBonus = false

    for (const condition of statusConditions) {
      if (persistentConditions.includes(condition)) {
        if (condition === 'Poisoned' || condition === 'Badly Poisoned') {
          if (!hasPoisonBonus) {
            statusModifier += 10
            hasPoisonBonus = true
          }
        } else {
          statusModifier += 10
        }
      } else if (volatileConditions.includes(condition)) {
        statusModifier += 5
      }
      if (condition === 'Stuck') {
        stuckModifier += 10
      }
      if (condition === 'Slowed') {
        slowModifier += 5
      }
    }

    // Injuries
    const injuryModifier = injuries * 5

    // Total
    const captureRate = base + levelModifier + hpModifier + evolutionModifier +
      shinyModifier + legendaryModifier + statusModifier + injuryModifier +
      stuckModifier + slowModifier

    // Difficulty description
    let difficulty = 'Nearly Impossible'
    if (captureRate >= 80) difficulty = 'Very Easy'
    else if (captureRate >= 60) difficulty = 'Easy'
    else if (captureRate >= 40) difficulty = 'Moderate'
    else if (captureRate >= 20) difficulty = 'Difficult'
    else if (captureRate >= 1) difficulty = 'Very Difficult'

    return {
      species: '',
      level,
      currentHp,
      maxHp,
      captureRate,
      difficulty,
      canBeCaptured,
      hpPercentage: Math.round(hpPercentage),
      breakdown: {
        base,
        levelModifier,
        hpModifier,
        evolutionModifier,
        shinyModifier,
        legendaryModifier,
        statusModifier,
        injuryModifier,
        stuckModifier,
        slowModifier
      }
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
