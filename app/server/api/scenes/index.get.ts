import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const scenes = await prisma.scene.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    const parsed = scenes.map((scene: any) => ({
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
    }))

    return {
      success: true,
      data: parsed
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch scenes'
    console.error('Error fetching scenes:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
