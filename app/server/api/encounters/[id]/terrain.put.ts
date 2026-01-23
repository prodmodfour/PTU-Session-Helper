import { prisma } from '~/server/utils/prisma'
import type { GridPosition, TerrainType } from '~/types'

interface TerrainCellData {
  position: GridPosition
  type: TerrainType
  elevation: number
  note?: string
}

interface TerrainStateBody {
  enabled?: boolean
  cells?: TerrainCellData[]
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<TerrainStateBody>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    // Verify encounter exists
    const existing = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    // Build terrain state object
    const currentState = JSON.parse(existing.terrainState || '{}')
    const newState = {
      cells: body.cells ?? currentState.cells ?? []
    }

    // Update encounter
    const updated = await prisma.encounter.update({
      where: { id },
      data: {
        terrainEnabled: body.enabled ?? existing.terrainEnabled,
        terrainState: JSON.stringify(newState)
      },
      select: {
        id: true,
        terrainEnabled: true,
        terrainState: true
      }
    })

    const parsedState = JSON.parse(updated.terrainState)

    return {
      success: true,
      data: {
        enabled: updated.terrainEnabled,
        cells: parsedState.cells
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to update terrain state'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
