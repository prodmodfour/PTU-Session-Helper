import { randomUUID } from 'crypto'
import { prisma } from '~/server/utils/prisma'
import { notifySceneCharacterAdded } from '~/server/utils/websocket'

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

    if (!body.characterId || !body.name) {
      throw createError({
        statusCode: 400,
        message: 'Character ID and name are required'
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
    const existingCharacters = JSON.parse(scene.characters) as Array<{
      id: string
      characterId: string
      name: string
      avatarUrl?: string | null
      position: { x: number; y: number }
      groupId?: string | null
    }>

    // Check if character already exists in scene
    if (existingCharacters.some(c => c.characterId === body.characterId)) {
      throw createError({
        statusCode: 400,
        message: 'Character already exists in this scene'
      })
    }

    // Create new character entry
    const newCharacter = {
      id: randomUUID(),
      characterId: body.characterId,
      name: body.name,
      avatarUrl: body.avatarUrl ?? null,
      position: body.position ?? { x: 50, y: 50 },
      groupId: body.groupId ?? null
    }

    // Add to array
    existingCharacters.push(newCharacter)

    // Update scene
    await prisma.scene.update({
      where: { id },
      data: { characters: JSON.stringify(existingCharacters) }
    })

    // Notify WebSocket clients if scene is active
    if (scene.isActive) {
      notifySceneCharacterAdded(id, newCharacter)
    }

    return {
      success: true,
      data: newCharacter
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to add character to scene'
    })
  }
})
