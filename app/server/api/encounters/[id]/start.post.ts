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

    const combatants = JSON.parse(encounter.combatants)

    if (combatants.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Cannot start encounter with no combatants'
      })
    }

    // Sort by initiative (descending)
    const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative)
    const turnOrder = sortedCombatants.map(c => c.id)

    // Reset turn state for all combatants
    combatants.forEach((c: any) => {
      c.hasActed = false
      c.actionsRemaining = 2
      c.shiftActionsRemaining = 1
    })

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

    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
      combatants,
      currentRound: 1,
      currentTurnIndex: 0,
      turnOrder,
      isActive: true,
      isPaused: false,
      moveLog: JSON.parse(encounter.moveLog),
      defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to start encounter'
    })
  }
})
