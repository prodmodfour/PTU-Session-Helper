import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    // Update the encounter with the full state
    const encounter = await prisma.encounter.update({
      where: { id },
      data: {
        name: body.name,
        battleType: body.battleType,
        combatants: JSON.stringify(body.combatants ?? []),
        currentRound: body.currentRound ?? 1,
        currentTurnIndex: body.currentTurnIndex ?? 0,
        turnOrder: JSON.stringify(body.turnOrder ?? []),
        isActive: body.isActive ?? true,
        isPaused: body.isPaused ?? false,
        isServed: body.isServed ?? false,
        moveLog: JSON.stringify(body.moveLog ?? []),
        defeatedEnemies: JSON.stringify(body.defeatedEnemies ?? [])
      }
    })

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
      message: error.message || 'Failed to update encounter'
    })
  }
})
