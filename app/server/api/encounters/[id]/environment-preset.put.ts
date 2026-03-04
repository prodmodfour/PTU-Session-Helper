/**
 * PUT /api/encounters/:id/environment-preset
 *
 * Set or clear the environment preset on an encounter.
 * Body: { environmentPreset: EnvironmentPreset | null }
 *
 * When preset is null or omitted, clears the active preset.
 */
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  // Validate preset shape if provided
  const preset = body.environmentPreset ?? null
  if (preset !== null) {
    if (typeof preset !== 'object' || !preset.id || !preset.name) {
      throw createError({
        statusCode: 400,
        message: 'environmentPreset must have at least id and name fields'
      })
    }
    if (!Array.isArray(preset.effects)) {
      throw createError({
        statusCode: 400,
        message: 'environmentPreset.effects must be an array'
      })
    }
  }

  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    const updated = await prisma.encounter.update({
      where: { id },
      data: {
        environmentPreset: preset ? JSON.stringify(preset) : '{}'
      }
    })

    return {
      success: true,
      data: {
        environmentPreset: preset
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to update environment preset'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
