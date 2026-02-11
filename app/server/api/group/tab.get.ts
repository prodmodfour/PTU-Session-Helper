import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    // Get or create the singleton GroupViewState
    let state = await prisma.groupViewState.findUnique({
      where: { id: 'singleton' }
    })

    if (!state) {
      state = await prisma.groupViewState.create({
        data: { id: 'singleton' }
      })
    }

    return {
      success: true,
      data: {
        activeTab: state.activeTab,
        activeSceneId: state.activeSceneId
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get tab state'
    console.error('Error getting tab state:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
