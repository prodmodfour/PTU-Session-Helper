import { prisma } from '~/server/utils/prisma'
import type { GridConfig } from '~/types'

export default defineEventHandler(async () => {
  try {
    const encounters = await prisma.encounter.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    const parsed = encounters.map(e => ({
      id: e.id,
      name: e.name,
      battleType: e.battleType,
      weather: e.weather ?? null,
      weatherDuration: e.weatherDuration ?? 0,
      weatherSource: e.weatherSource ?? null,
      combatants: JSON.parse(e.combatants),
      currentRound: e.currentRound,
      currentTurnIndex: e.currentTurnIndex,
      turnOrder: JSON.parse(e.turnOrder),
      currentPhase: (e.currentPhase ?? 'pokemon') as 'trainer_declaration' | 'trainer_resolution' | 'pokemon',
      trainerTurnOrder: JSON.parse(e.trainerTurnOrder || '[]'),
      pokemonTurnOrder: JSON.parse(e.pokemonTurnOrder || '[]'),
      isActive: e.isActive,
      isPaused: e.isPaused,
      isServed: e.isServed,
      gridConfig: {
        enabled: e.gridEnabled,
        width: e.gridWidth,
        height: e.gridHeight,
        cellSize: e.gridCellSize,
        background: e.gridBackground ?? undefined,
      } as GridConfig,
      sceneNumber: 1,
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
