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

    // Check if scene exists
    const existing = await prisma.scene.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Scene not found'
      })
    }

    // If this scene was active, clear the GroupViewState reference
    if (existing.isActive) {
      await prisma.groupViewState.updateMany({
        where: { activeSceneId: id },
        data: { activeSceneId: null }
      })
    }

    await prisma.scene.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Scene deleted successfully'
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to delete scene'
    console.error('Error deleting scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
