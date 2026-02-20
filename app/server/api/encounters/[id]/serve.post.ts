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
    // Atomic: unserve all then serve this one in a single transaction
    const encounter = await prisma.$transaction(async (tx) => {
      await tx.encounter.updateMany({
        where: { isServed: true },
        data: { isServed: false }
      })

      return tx.encounter.update({
        where: { id },
        data: { isServed: true }
      })
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
    const message = error instanceof Error ? error.message : 'Failed to serve encounter'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
