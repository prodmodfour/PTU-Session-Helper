import { prisma } from '~/server/utils/prisma'
import { broadcastToGroup } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Scene ID is required'
      })
    }

    // Deactivate all other scenes first
    await prisma.scene.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // Activate this scene
    const scene = await prisma.scene.update({
      where: { id },
      data: { isActive: true }
    })

    // Update GroupViewState to point to this scene
    await prisma.groupViewState.upsert({
      where: { id: 'singleton' },
      update: { activeSceneId: scene.id },
      create: { id: 'singleton', activeSceneId: scene.id }
    })

    const parsed = {
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

    // Broadcast scene activation to group clients
    broadcastToGroup('scene_activated', { scene: parsed })

    return {
      success: true,
      data: parsed
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to activate scene'
    console.error('Error activating scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
