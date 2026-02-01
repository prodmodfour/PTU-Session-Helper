import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const scene = await prisma.scene.findFirst({
      where: { isActive: true }
    })

    if (!scene) {
      return {
        success: true,
        data: null
      }
    }

    return {
      success: true,
      data: {
        id: scene.id,
        name: scene.name,
        description: scene.description,
        locationName: scene.locationName,
        locationImage: scene.locationImage,
        pokemon: JSON.parse(scene.pokemon),
        characters: JSON.parse(scene.characters),
        groups: JSON.parse(scene.groups),
        weather: scene.weather,
        terrains: JSON.parse(scene.terrains),
        modifiers: JSON.parse(scene.modifiers),
        habitatId: scene.habitatId,
        isActive: scene.isActive,
        createdAt: scene.createdAt,
        updatedAt: scene.updatedAt
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch active scene'
    console.error('Error fetching active scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
