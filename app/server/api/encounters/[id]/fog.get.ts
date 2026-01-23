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
        fogOfWarEnabled: true,
        fogOfWarState: true
      }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    // Parse fog state from JSON
    let fogState = { cells: [], defaultState: 'hidden' }
    try {
      const parsed = JSON.parse(encounter.fogOfWarState || '{}')
      if (parsed.cells) {
        fogState = parsed
      }
    } catch {
      // Default state if parsing fails
    }

    return {
      success: true,
      data: {
        enabled: encounter.fogOfWarEnabled,
        ...fogState
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to get fog state'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
