import { prisma } from '~/server/utils/prisma'
import type { GridConfig } from '~/types'

// Default grid configuration
const DEFAULT_GRID_CONFIG: GridConfig = {
  enabled: false,
  width: 20,
  height: 15,
  cellSize: 40,
}

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
        isServed: false,
        gridEnabled: body.gridEnabled ?? false,
        gridWidth: body.gridWidth ?? 20,
        gridHeight: body.gridHeight ?? 15,
        gridCellSize: body.gridCellSize ?? 40,
        gridBackground: body.gridBackground ?? null,
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
