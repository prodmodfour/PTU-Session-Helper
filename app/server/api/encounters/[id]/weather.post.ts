/**
 * POST /api/encounters/:id/weather
 *
 * Set or clear weather on an encounter with PTU duration tracking.
 * Body: { weather: string | null, source?: 'move' | 'ability' | 'manual', duration?: number }
 *
 * PTU rules: Weather from moves lasts 5 rounds.
 * Weather from abilities persists while the ability user is active.
 * Manual weather has no auto-expiration (duration 0).
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, buildEncounterResponse } from '~/server/services/encounter.service'

const PTU_WEATHER_DURATION = 5

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    const body = await readBody(event)

    const { record, combatants } = await loadEncounter(id)

    const weather = body.weather ?? null
    const source: string | null = weather ? (body.source ?? 'manual') : null

    // Determine duration based on source
    let duration = 0
    if (weather) {
      if (body.duration !== undefined && body.duration !== null) {
        // Explicit duration provided
        duration = Math.max(0, Math.round(body.duration))
      } else if (source === 'move' || source === 'ability') {
        // PTU default: 5 rounds for moves and abilities
        duration = PTU_WEATHER_DURATION
      }
      // Manual weather: duration stays 0 (indefinite)
    }

    const updated = await prisma.encounter.update({
      where: { id },
      data: {
        weather,
        weatherDuration: duration,
        weatherSource: source
      }
    })

    const response = buildEncounterResponse(
      { ...record, weather: updated.weather, weatherDuration: updated.weatherDuration, weatherSource: updated.weatherSource },
      combatants
    )

    return { success: true, data: response }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to set weather'
    })
  }
})
