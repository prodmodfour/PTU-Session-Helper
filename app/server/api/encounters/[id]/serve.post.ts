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
    // Atomic: unserve all then serve this one in a single transaction
    const encounter = await prisma.$transaction(async (tx) => {
      await tx.encounter.updateMany({
        where: { isServed: true },
        data: { isServed: false }
      })

      return tx.encounter.update({
        where: { id },
        data: { isServed: true }
      })
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
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
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to serve encounter'
    })
  }
})
