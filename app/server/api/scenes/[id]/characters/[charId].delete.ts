import { prisma } from '~/server/utils/prisma'
import { notifySceneCharacterRemoved } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const charId = getRouterParam(event, 'charId')

    if (!id || !charId) {
      throw createError({
        statusCode: 400,
        message: 'Scene ID and Character ID are required'
      })
    }

    // Fetch the scene
    const scene = await prisma.scene.findUnique({
      where: { id }
    })

    if (!scene) {
      throw createError({
        statusCode: 404,
        message: 'Scene not found'
      })
    }

    // Parse existing characters
    const existingCharacters = JSON.parse(scene.characters) as Array<{ id: string }>

    // Find and remove the character
    const index = existingCharacters.findIndex(c => c.id === charId)

    if (index === -1) {
      throw createError({
        statusCode: 404,
        message: 'Character not found in scene'
      })
    }

    existingCharacters.splice(index, 1)

    // Update scene
    await prisma.scene.update({
      where: { id },
      data: { characters: JSON.stringify(existingCharacters) }
    })

    // Notify WebSocket clients if scene is active
    if (scene.isActive) {
      notifySceneCharacterRemoved(id, charId)
    }

    return {
      success: true,
      message: 'Character removed from scene'
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to remove character from scene'
    console.error('Error removing character from scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
