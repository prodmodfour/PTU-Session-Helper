import { prisma } from '~/server/utils/prisma'
import { notifySceneGroupUpdated } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const groupId = getRouterParam(event, 'groupId')

    if (!id || !groupId) {
      throw createError({
        statusCode: 400,
        message: 'Scene ID and Group ID are required'
      })
    }

    const body = await readBody(event)

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

    // Parse existing groups
    const existingGroups = JSON.parse(scene.groups) as Array<{
      id: string
      name: string
      position: { x: number; y: number }
      width: number
      height: number
    }>

    // Find the group
    const groupIndex = existingGroups.findIndex(g => g.id === groupId)

    if (groupIndex === -1) {
      throw createError({
        statusCode: 404,
        message: 'Group not found in scene'
      })
    }

    // Update group (immutably)
    const updatedGroup = {
      ...existingGroups[groupIndex],
      ...(body.name !== undefined && { name: body.name }),
      ...(body.position !== undefined && { position: body.position }),
      ...(body.width !== undefined && { width: body.width }),
      ...(body.height !== undefined && { height: body.height })
    }

    existingGroups[groupIndex] = updatedGroup

    // Update scene
    await prisma.scene.update({
      where: { id },
      data: { groups: JSON.stringify(existingGroups) }
    })

    // Notify WebSocket clients if scene is active
    if (scene.isActive) {
      notifySceneGroupUpdated(id, updatedGroup)
    }

    return {
      success: true,
      data: updatedGroup
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update group in scene'
    })
  }
})
