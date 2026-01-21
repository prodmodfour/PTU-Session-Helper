import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    // Find the currently served encounter
    const encounter = await prisma.encounter.findFirst({
      where: { isServed: true }
    })

    if (!encounter) {
      return { success: true, data: null }
    }

    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
      combatants: JSON.parse(encounter.combatants),
      currentRound: encounter.currentRound,
      currentTurnIndex: encounter.currentTurnIndex,
      turnOrder: JSON.parse(encounter.turnOrder),
      isActive: encounter.isActive,
      isPaused: encounter.isPaused,
      isServed: encounter.isServed,
      moveLog: JSON.parse(encounter.moveLog),
      defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch served encounter'
    })
  }
})
