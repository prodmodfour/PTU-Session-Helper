import { prisma } from '~/server/utils/prisma'
import { notifySceneUpdate } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Scene ID is required'
      })
    }

    const body = await readBody(event)

    // Build update data object
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.locationName !== undefined) updateData.locationName = body.locationName
    if (body.locationImage !== undefined) updateData.locationImage = body.locationImage
    if (body.pokemon !== undefined) updateData.pokemon = JSON.stringify(body.pokemon)
    if (body.characters !== undefined) updateData.characters = JSON.stringify(body.characters)
    if (body.groups !== undefined) updateData.groups = JSON.stringify(body.groups)
    if (body.weather !== undefined) updateData.weather = body.weather
    if (body.terrains !== undefined) updateData.terrains = JSON.stringify(body.terrains)
    if (body.modifiers !== undefined) updateData.modifiers = JSON.stringify(body.modifiers)
    if (body.habitatId !== undefined) updateData.habitatId = body.habitatId

    const scene = await prisma.scene.update({
      where: { id },
      data: updateData
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

    // Notify WebSocket clients if scene is active
    if (scene.isActive) {
      notifySceneUpdate(scene.id, parsed)
    }

    return {
      success: true,
      data: parsed
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update scene'
    })
  }
})
