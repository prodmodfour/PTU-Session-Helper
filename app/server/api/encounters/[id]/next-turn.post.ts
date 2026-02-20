import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse } from '~/server/services/encounter.service'

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

    if (!encounter.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Encounter is not active'
      })
    }

    const combatants = JSON.parse(encounter.combatants)
    const turnOrder = JSON.parse(encounter.turnOrder)
    let currentTurnIndex = encounter.currentTurnIndex
    let currentRound = encounter.currentRound

    // Weather duration tracking
    let weather = encounter.weather
    let weatherDuration = encounter.weatherDuration ?? 0
    let weatherSource = encounter.weatherSource

    // Mark current combatant as having acted and clear temp conditions (Sprint, Tripped, etc.)
    const currentCombatantId = turnOrder[currentTurnIndex]
    const currentCombatant = combatants.find((c: any) => c.id === currentCombatantId)
    if (currentCombatant) {
      currentCombatant.hasActed = true
      currentCombatant.actionsRemaining = 0
      currentCombatant.shiftActionsRemaining = 0
      // Clear temporary conditions that last "until next turn"
      currentCombatant.tempConditions = []
    }

    // Move to next turn
    currentTurnIndex++

    // Check if round is over
    if (currentTurnIndex >= turnOrder.length) {
      currentTurnIndex = 0
      currentRound++

      // Reset all combatants for new round
      combatants.forEach((c: any) => {
        c.hasActed = false
        c.actionsRemaining = 2
        c.shiftActionsRemaining = 1
        c.readyAction = null
      })

      // Decrement weather duration at end of round (PTU: weather lasts N rounds)
      // Only decrement if duration is tracked (> 0) and source is not 'manual'
      if (weather && weatherDuration > 0 && weatherSource !== 'manual') {
        weatherDuration--
        if (weatherDuration <= 0) {
          // Weather expires
          weather = null
          weatherDuration = 0
          weatherSource = null
        }
      }
    }

    const updatedRecord = await prisma.encounter.update({
      where: { id },
      data: {
        currentTurnIndex,
        currentRound,
        combatants: JSON.stringify(combatants),
        weather,
        weatherDuration,
        weatherSource
      }
    })

    const response = buildEncounterResponse(updatedRecord, combatants)

    return { success: true, data: response }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to advance turn'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
