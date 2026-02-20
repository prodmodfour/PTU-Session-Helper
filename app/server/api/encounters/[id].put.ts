import { prisma } from '~/server/utils/prisma'
import type { GridConfig } from '~/types'

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
        weather: body.weather ?? null,
        weatherDuration: body.weatherDuration ?? 0,
        weatherSource: body.weatherSource ?? null,
        combatants: JSON.stringify(body.combatants ?? []),
        currentRound: body.currentRound ?? 1,
        currentTurnIndex: body.currentTurnIndex ?? 0,
        turnOrder: JSON.stringify(body.turnOrder ?? []),
        isActive: body.isActive ?? true,
        isPaused: body.isPaused ?? false,
        isServed: body.isServed ?? false,
        gridEnabled: body.gridConfig?.enabled ?? false,
        gridWidth: body.gridConfig?.width ?? 20,
        gridHeight: body.gridConfig?.height ?? 15,
        gridCellSize: body.gridConfig?.cellSize ?? 40,
        gridBackground: body.gridConfig?.background ?? null,
        moveLog: JSON.stringify(body.moveLog ?? []),
        defeatedEnemies: JSON.stringify(body.defeatedEnemies ?? [])
      }
    })

    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
      weather: encounter.weather ?? null,
      weatherDuration: encounter.weatherDuration ?? 0,
      weatherSource: encounter.weatherSource ?? null,
      combatants: JSON.parse(encounter.combatants),
      currentRound: encounter.currentRound,
      currentTurnIndex: encounter.currentTurnIndex,
      turnOrder: JSON.parse(encounter.turnOrder),
      currentPhase: 'pokemon' as const,
      trainerTurnOrder: [],
      pokemonTurnOrder: [],
      isActive: encounter.isActive,
      isPaused: encounter.isPaused,
      isServed: encounter.isServed,
      gridConfig: {
        enabled: encounter.gridEnabled,
        width: encounter.gridWidth,
        height: encounter.gridHeight,
        cellSize: encounter.gridCellSize,
        background: encounter.gridBackground ?? undefined,
      } as GridConfig,
      sceneNumber: 1,
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
