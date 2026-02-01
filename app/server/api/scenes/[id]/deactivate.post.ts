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

    // Deactivate the scene
    const scene = await prisma.scene.update({
      where: { id },
      data: { isActive: false }
    })

    // Clear GroupViewState if it was pointing to this scene
    await prisma.groupViewState.updateMany({
      where: { activeSceneId: id },
      data: { activeSceneId: null }
    })

    // Broadcast scene deactivation to group clients
    broadcastToGroup('scene_deactivated', { sceneId: scene.id })

    return {
      success: true,
      message: 'Scene deactivated successfully'
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to deactivate scene'
    console.error('Error deactivating scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
