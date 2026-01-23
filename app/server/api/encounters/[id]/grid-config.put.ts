import { prisma } from '~/server/utils/prisma'
import type { GridConfig } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<Partial<GridConfig>>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    // Get current encounter to preserve existing values
    const encounter = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    // Validate dimensions if provided
    if (body.width !== undefined && (body.width < 5 || body.width > 100)) {
      throw createError({
        statusCode: 400,
        message: 'Grid width must be between 5 and 100'
      })
    }

    if (body.height !== undefined && (body.height < 5 || body.height > 100)) {
      throw createError({
        statusCode: 400,
        message: 'Grid height must be between 5 and 100'
      })
    }

    if (body.cellSize !== undefined && (body.cellSize < 20 || body.cellSize > 100)) {
      throw createError({
        statusCode: 400,
        message: 'Cell size must be between 20 and 100'
      })
    }

    // Update grid config
    const updated = await prisma.encounter.update({
      where: { id },
      data: {
        gridEnabled: body.enabled ?? encounter.gridEnabled,
        gridWidth: body.width ?? encounter.gridWidth,
        gridHeight: body.height ?? encounter.gridHeight,
        gridCellSize: body.cellSize ?? encounter.gridCellSize,
        gridBackground: body.background !== undefined ? body.background : encounter.gridBackground,
      }
    })

    const gridConfig: GridConfig = {
      enabled: updated.gridEnabled,
      width: updated.gridWidth,
      height: updated.gridHeight,
      cellSize: updated.gridCellSize,
      background: updated.gridBackground ?? undefined,
    }

    return {
      success: true,
      data: gridConfig
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update grid config'
    })
  }
})
