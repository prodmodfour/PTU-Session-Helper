import { prisma } from '~/server/utils/prisma'
import type { GridConfig, GridPosition, Combatant } from '~/types'

interface PositionUpdateBody {
  combatantId: string
  position: GridPosition
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<PositionUpdateBody>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  if (!body.combatantId || !body.position) {
    throw createError({
      statusCode: 400,
      message: 'combatantId and position are required'
    })
  }

  if (typeof body.position.x !== 'number' || typeof body.position.y !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'Position must have numeric x and y values'
    })
  }

  try {
    // Get current encounter
    const encounter = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    // Parse combatants
    const combatants: Combatant[] = JSON.parse(encounter.combatants)

    // Find and update the combatant's position
    const combatantIndex = combatants.findIndex(c => c.id === body.combatantId)
    if (combatantIndex === -1) {
      throw createError({
        statusCode: 404,
        message: 'Combatant not found'
      })
    }

    // Validate position is within grid bounds
    if (encounter.gridEnabled) {
      if (body.position.x < 0 || body.position.x >= encounter.gridWidth ||
          body.position.y < 0 || body.position.y >= encounter.gridHeight) {
        throw createError({
          statusCode: 400,
          message: 'Position is outside grid bounds'
        })
      }
    }

    // Update position
    combatants[combatantIndex] = {
      ...combatants[combatantIndex],
      position: body.position
    }

    // Save to database
    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(combatants)
      }
    })

    return {
      success: true,
      data: {
        combatantId: body.combatantId,
        position: body.position
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update position'
    })
  }
})
