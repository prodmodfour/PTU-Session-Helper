import { prisma } from '~/server/utils/prisma'

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

    // Mark current combatant as having acted
    const currentCombatantId = turnOrder[currentTurnIndex]
    const currentCombatant = combatants.find((c: any) => c.id === currentCombatantId)
    if (currentCombatant) {
      currentCombatant.hasActed = true
      currentCombatant.actionsRemaining = 0
      currentCombatant.shiftActionsRemaining = 0
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
    }

    await prisma.encounter.update({
      where: { id },
      data: {
        currentTurnIndex,
        currentRound,
        combatants: JSON.stringify(combatants)
      }
    })

    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
      combatants,
      currentRound,
      currentTurnIndex,
      turnOrder,
      isActive: encounter.isActive,
      isPaused: encounter.isPaused,
      moveLog: JSON.parse(encounter.moveLog),
      defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to advance turn'
    })
  }
})
