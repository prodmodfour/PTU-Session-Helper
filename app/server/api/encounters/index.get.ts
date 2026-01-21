import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const encounters = await prisma.encounter.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    const parsed = encounters.map(e => ({
      id: e.id,
      name: e.name,
      battleType: e.battleType,
      combatants: JSON.parse(e.combatants),
      currentRound: e.currentRound,
      currentTurnIndex: e.currentTurnIndex,
      turnOrder: JSON.parse(e.turnOrder),
      isActive: e.isActive,
      isPaused: e.isPaused,
      moveLog: JSON.parse(e.moveLog),
      defeatedEnemies: JSON.parse(e.defeatedEnemies)
    }))

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch encounters'
    })
  }
})
