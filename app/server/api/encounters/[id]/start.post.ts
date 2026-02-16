import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse } from '~/server/services/encounter.service'

/**
 * Roll a d20 for initiative tie-breaking
 */
function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

/**
 * Sort combatants by initiative with d20 roll-off for ties
 * Returns sorted array (highest initiative first)
 */
function sortByInitiativeWithRollOff(combatants: any[], descending: boolean = true): any[] {
  // Group combatants by initiative value
  const initiativeGroups = new Map<number, any[]>()

  for (const c of combatants) {
    const init = c.initiative
    if (!initiativeGroups.has(init)) {
      initiativeGroups.set(init, [])
    }
    initiativeGroups.get(init)!.push(c)
  }

  // For each group with ties, assign roll-off values
  for (const [init, group] of initiativeGroups) {
    if (group.length > 1) {
      // Roll d20 for each combatant in the tie
      for (const c of group) {
        c.initiativeRollOff = rollD20()
      }
      // Re-roll any remaining ties within the group
      let hasTies = true
      while (hasTies) {
        const rollOffValues = group.map(c => c.initiativeRollOff)
        const uniqueValues = new Set(rollOffValues)
        if (uniqueValues.size === group.length) {
          hasTies = false
        } else {
          // Find tied roll-offs and re-roll them
          const rollCounts = new Map<number, any[]>()
          for (const c of group) {
            const roll = c.initiativeRollOff
            if (!rollCounts.has(roll)) rollCounts.set(roll, [])
            rollCounts.get(roll)!.push(c)
          }
          for (const [roll, tied] of rollCounts) {
            if (tied.length > 1) {
              for (const c of tied) {
                c.initiativeRollOff = rollD20()
              }
            }
          }
        }
      }
    }
  }

  // Sort by initiative (primary) and roll-off (secondary)
  return [...combatants].sort((a, b) => {
    const initDiff = b.initiative - a.initiative
    if (initDiff !== 0) return descending ? initDiff : -initDiff
    // Tie-breaker: higher roll-off wins
    const rollDiff = (b.initiativeRollOff || 0) - (a.initiativeRollOff || 0)
    return descending ? rollDiff : -rollDiff
  })
}

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

    const combatants = JSON.parse(encounter.combatants)

    if (combatants.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Cannot start encounter with no combatants'
      })
    }

    // Reset turn state for all combatants
    combatants.forEach((c: any) => {
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

      const trainers = combatants.filter((c: any) => c.type === 'human')
      const pokemon = combatants.filter((c: any) => c.type === 'pokemon')

      // Sort trainers by initiative (high→low for action resolution)
      const sortedTrainers = sortByInitiativeWithRollOff(trainers, true)
      // Sort pokemon by initiative (high→low)
      const sortedPokemon = sortByInitiativeWithRollOff(pokemon, true)

      trainerTurnOrder = sortedTrainers.map((c: any) => c.id)
      pokemonTurnOrder = sortedPokemon.map((c: any) => c.id)

      // In trainer battles, trainers go first
      // turnOrder is trainers (high→low) then pokemon (high→low)
      turnOrder = [...trainerTurnOrder, ...pokemonTurnOrder]
      currentPhase = trainers.length > 0 ? 'trainer' : 'pokemon'

    } else {
      // Full Contact / Wild Encounter: Everyone in initiative order
      const sortedCombatants = sortByInitiativeWithRollOff(combatants, true)
      turnOrder = sortedCombatants.map((c: any) => c.id)
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
