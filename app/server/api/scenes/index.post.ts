import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.name) {
      throw createError({
        statusCode: 400,
        message: 'Scene name is required'
      })
    }

    const scene = await prisma.scene.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        locationName: body.locationName ?? null,
        locationImage: body.locationImage ?? null,
        weather: body.weather ?? null,
        terrains: JSON.stringify(body.terrains ?? []),
        modifiers: JSON.stringify(body.modifiers ?? []),
        habitatId: body.habitatId ?? null
      }
    })

    return {
      success: true,
      data: {
        id: scene.id,
        name: scene.name,
        description: scene.description,
        locationName: scene.locationName,
        locationImage: scene.locationImage,
        pokemon: [],
        characters: [],
        groups: [],
        weather: scene.weather,
        terrains: JSON.parse(scene.terrains),
        modifiers: JSON.parse(scene.modifiers),
        habitatId: scene.habitatId,
        isActive: scene.isActive,
        createdAt: scene.createdAt,
        updatedAt: scene.updatedAt
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create scene'
    })
  }
})
