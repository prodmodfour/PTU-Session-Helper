import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse, sortByInitiativeWithRollOff } from '~/server/services/encounter.service'
import type { Combatant } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    const combatants: Combatant[] = JSON.parse(encounter.combatants)

    if (combatants.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Cannot start encounter with no combatants'
      })
    }

    // Reset turn state for all combatants
    combatants.forEach((c) => {
      c.hasActed = false
      c.actionsRemaining = 2
      c.shiftActionsRemaining = 1
      c.turnState = {
        hasActed: false,
        standardActionUsed: false,
        shiftActionUsed: false,
        swiftActionUsed: false,
        canBeCommanded: true,
        isHolding: false
      }
    })

    let turnOrder: string[] = []
    let trainerTurnOrder: string[] = []
    let pokemonTurnOrder: string[] = []
    let currentPhase: 'trainer' | 'pokemon' = 'pokemon'

    if (encounter.battleType === 'trainer') {
      // League Battle: Trainers act first, then Pokemon
      // Trainers: declare low→high speed, resolve high→low
      // Pokemon: act high→low speed

      const trainers = combatants.filter((c) => c.type === 'human')
      const pokemon = combatants.filter((c) => c.type === 'pokemon')

      // Sort trainers by initiative (high→low for action resolution)
      const sortedTrainers = sortByInitiativeWithRollOff(trainers, true)
      // Sort pokemon by initiative (high→low)
      const sortedPokemon = sortByInitiativeWithRollOff(pokemon, true)

      trainerTurnOrder = sortedTrainers.map((c) => c.id)
      pokemonTurnOrder = sortedPokemon.map((c) => c.id)

      // In trainer battles, trainers go first
      // turnOrder is trainers (high→low) then pokemon (high→low)
      turnOrder = [...trainerTurnOrder, ...pokemonTurnOrder]
      currentPhase = trainers.length > 0 ? 'trainer' : 'pokemon'

    } else {
      // Full Contact / Wild Encounter: Everyone in initiative order
      const sortedCombatants = sortByInitiativeWithRollOff(combatants, true)
      turnOrder = sortedCombatants.map((c) => c.id)
      currentPhase = 'pokemon' // Phase doesn't matter for full contact
    }

    await prisma.encounter.update({
      where: { id },
      data: {
        isActive: true,
        isPaused: false,
        currentRound: 1,
        currentTurnIndex: 0,
        turnOrder: JSON.stringify(turnOrder),
        combatants: JSON.stringify(combatants)
      }
    })

    const response = buildEncounterResponse(encounter, combatants, {
      isActive: true,
      isPaused: false,
      currentRound: 1,
      currentTurnIndex: 0,
      turnOrder,
      trainerTurnOrder,
      pokemonTurnOrder,
      currentPhase
    })

    return { success: true, data: response }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to start encounter'
    })
  }
})
