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
    const encounter = await prisma.encounter.findUnique({
      where: { id },
      select: {
        id: true,
        terrainEnabled: true,
        terrainState: true
      }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    // Parse terrain state from JSON
    let terrainData = { cells: [] }
    try {
      const parsed = JSON.parse(encounter.terrainState || '{}')
      if (parsed.cells) {
        terrainData = parsed
      }
    } catch {
      // Default state if parsing fails
    }

    return {
      success: true,
      data: {
        enabled: encounter.terrainEnabled,
        cells: terrainData.cells
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to get terrain state'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
