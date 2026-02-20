import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse } from '~/server/services/encounter.service'
import type { Combatant } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    // Unserve this encounter
    const encounter = await prisma.encounter.update({
      where: { id },
      data: { isServed: false }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    const combatants = JSON.parse(encounter.combatants) as Combatant[]
    const response = buildEncounterResponse(encounter, combatants)

    return { success: true, data: response }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to unserve encounter'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
