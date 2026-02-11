import { prisma } from '~/server/utils/prisma'
import { broadcastToGroup } from '~/server/utils/websocket'

const validTabs = ['lobby', 'scene', 'encounter', 'map'] as const

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.activeTab || !validTabs.includes(body.activeTab)) {
      throw createError({
        statusCode: 400,
        message: `Invalid tab. Must be one of: ${validTabs.join(', ')}`
      })
    }

    // Upsert the singleton GroupViewState
    const state = await prisma.groupViewState.upsert({
      where: { id: 'singleton' },
      update: {
        activeTab: body.activeTab,
        activeSceneId: body.activeSceneId ?? null
      },
      create: {
        id: 'singleton',
        activeTab: body.activeTab,
        activeSceneId: body.activeSceneId ?? null
      }
    })

    // Broadcast tab change to all group clients
    broadcastToGroup('tab_change', {
      tab: state.activeTab,
      sceneId: state.activeSceneId
    })

    return {
      success: true,
      data: {
        activeTab: state.activeTab,
        activeSceneId: state.activeSceneId
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update tab state'
    })
  }
})
