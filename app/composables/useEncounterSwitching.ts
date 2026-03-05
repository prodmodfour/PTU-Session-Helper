import type { Encounter } from '~/types'

/**
 * Composable for encounter Pokemon switching actions.
 * Handles switch, recall, and release operations.
 */

interface EncounterSwitchingContext {
  getEncounter: () => Encounter | null
  setEncounter: (enc: Encounter) => void
  setError: (msg: string) => void
}

export function useEncounterSwitching(ctx: EncounterSwitchingContext) {
  /** Perform a full Pokemon switch (recall one, release another) as a Standard Action */
  async function switchPokemon(
    trainerId: string,
    recallCombatantId: string,
    releaseEntityId: string,
    options?: {
      faintedSwitch?: boolean
      forced?: boolean
      releasePosition?: { x: number; y: number }
    }
  ) {
    const encounter = ctx.getEncounter()
    if (!encounter) return

    try {
      const response = await $fetch<{
        data: {
          encounter: Encounter
          switchDetails: {
            trainerName: string
            recalledName: string
            releasedName: string
            actionCost: 'standard' | 'shift' | 'none'
            rangeToRecalled: number
            releasedInitiative: number
            canActThisRound: boolean
          }
        }
      }>(`/api/encounters/${encounter.id}/switch`, {
        method: 'POST',
        body: {
          trainerId,
          recallCombatantId,
          releaseEntityId,
          faintedSwitch: options?.faintedSwitch ?? false,
          forced: options?.forced ?? false,
          releasePosition: options?.releasePosition
        }
      })
      ctx.setEncounter(response.data.encounter)
      return response.data
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to switch Pokemon')
      throw e
    }
  }

  /** Recall one or two Pokemon from the field (P2 Section L) */
  async function recallPokemon(
    trainerId: string,
    pokemonCombatantIds: string[]
  ) {
    const encounter = ctx.getEncounter()
    if (!encounter) return

    try {
      const response = await $fetch<{
        data: {
          encounter: Encounter
          recallDetails: {
            trainerName: string
            recalledNames: string[]
            actionCost: 'standard' | 'shift'
            count: number
          }
        }
      }>(`/api/encounters/${encounter.id}/recall`, {
        method: 'POST',
        body: { trainerId, pokemonCombatantIds }
      })
      ctx.setEncounter(response.data.encounter)
      return response.data
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to recall Pokemon')
      throw e
    }
  }

  /** Release one or two Pokemon onto the field (P2 Section L) */
  async function releasePokemon(
    trainerId: string,
    pokemonEntityIds: string[],
    positions?: Array<{ x: number; y: number } | null>
  ) {
    const encounter = ctx.getEncounter()
    if (!encounter) return

    try {
      const response = await $fetch<{
        data: {
          encounter: Encounter
          releaseDetails: {
            trainerName: string
            releasedNames: string[]
            releasedCombatantIds: string[]
            actionCost: 'standard' | 'shift'
            count: number
            countsAsSwitch: boolean
          }
        }
      }>(`/api/encounters/${encounter.id}/release`, {
        method: 'POST',
        body: { trainerId, pokemonEntityIds, positions }
      })
      ctx.setEncounter(response.data.encounter)
      return response.data
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to release Pokemon')
      throw e
    }
  }

  return {
    switchPokemon,
    recallPokemon,
    releasePokemon
  }
}
