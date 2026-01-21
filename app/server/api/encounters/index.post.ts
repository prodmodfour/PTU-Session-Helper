import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const encounter = await prisma.encounter.create({
      data: {
        name: body.name || 'New Encounter',
        battleType: body.battleType || 'trainer',
        combatants: '[]',
        currentRound: 1,
        currentTurnIndex: 0,
        turnOrder: '[]',
        isActive: false,
        isPaused: false,
        moveLog: '[]',
        defeatedEnemies: '[]'
      }
    })

    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
      combatants: [],
      currentRound: encounter.currentRound,
      currentTurnIndex: encounter.currentTurnIndex,
      turnOrder: [],
      isActive: encounter.isActive,
      isPaused: encounter.isPaused,
      moveLog: [],
      defeatedEnemies: []
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create encounter'
    })
  }
})
