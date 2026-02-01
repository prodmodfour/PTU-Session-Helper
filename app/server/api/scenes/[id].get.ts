import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Scene ID is required'
      })
    }

    const scene = await prisma.scene.findUnique({
      where: { id }
    })

    if (!scene) {
      throw createError({
        statusCode: 404,
        message: 'Scene not found'
      })
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
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch scene'
    console.error('Error fetching scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
