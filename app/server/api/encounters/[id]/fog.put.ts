import { prisma } from '~/server/utils/prisma'

interface FogStateBody {
  enabled?: boolean
  cells?: [string, string][]
  defaultState?: 'hidden' | 'revealed' | 'explored'
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<FogStateBody>(event)

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

    // Validate defaultState if provided
    if (body.defaultState && !['hidden', 'revealed', 'explored'].includes(body.defaultState)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid defaultState. Must be hidden, revealed, or explored'
      })
    }

    // Build fog state object
    const currentState = JSON.parse(existing.fogOfWarState || '{}')
    const newState = {
      cells: body.cells ?? currentState.cells ?? [],
      defaultState: body.defaultState ?? currentState.defaultState ?? 'hidden'
    }

    // Update encounter
    const updated = await prisma.encounter.update({
      where: { id },
      data: {
        fogOfWarEnabled: body.enabled ?? existing.fogOfWarEnabled,
        fogOfWarState: JSON.stringify(newState)
      },
      select: {
        id: true,
        fogOfWarEnabled: true,
        fogOfWarState: true
      }
    })

    const parsedState = JSON.parse(updated.fogOfWarState)

    return {
      success: true,
      data: {
        enabled: updated.fogOfWarEnabled,
        cells: parsedState.cells,
        defaultState: parsedState.defaultState
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to update fog state'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
