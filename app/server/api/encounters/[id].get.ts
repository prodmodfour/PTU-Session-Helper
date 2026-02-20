import { loadEncounter, buildEncounterResponse } from '~/server/services/encounter.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)
    const response = buildEncounterResponse(record, combatants)

    return { success: true, data: response }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to fetch encounter'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
