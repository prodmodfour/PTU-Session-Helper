import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse } from '~/server/services/encounter.service'
import type { Combatant } from '~/types'

export default defineEventHandler(async () => {
  try {
    // Find the currently served encounter
    const encounter = await prisma.encounter.findFirst({
      where: { isServed: true }
    })

    if (!encounter) {
      return { success: true, data: null }
    }

    const combatants = JSON.parse(encounter.combatants) as Combatant[]
    const response = buildEncounterResponse(encounter, combatants)

    return { success: true, data: response }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch served encounter'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
