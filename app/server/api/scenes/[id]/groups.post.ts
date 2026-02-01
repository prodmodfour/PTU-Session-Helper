import { randomUUID } from 'crypto'
import { prisma } from '~/server/utils/prisma'
import { notifySceneGroupCreated } from '~/server/utils/websocket'

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

    // Create new group
    const newGroup = {
      id: randomUUID(),
      name: body.name ?? 'New Group',
      position: body.position ?? { x: 100, y: 100 },
      width: body.width ?? 150,
      height: body.height ?? 100
    }

    // Add to array
    existingGroups.push(newGroup)

    // Update scene
    await prisma.scene.update({
      where: { id },
      data: { groups: JSON.stringify(existingGroups) }
    })

    // Notify WebSocket clients if scene is active
    if (scene.isActive) {
      notifySceneGroupCreated(id, newGroup)
    }

    return {
      success: true,
      data: newGroup
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create group in scene'
    })
  }
})
