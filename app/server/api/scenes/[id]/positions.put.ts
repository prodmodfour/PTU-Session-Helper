import { prisma } from '~/server/utils/prisma'
import { notifyScenePositionsUpdated } from '~/server/utils/websocket'

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

    // Parse existing data
    const existingPokemon = JSON.parse(scene.pokemon) as Array<{
      id: string
      position: { x: number; y: number }
      groupId?: string | null
    }>
    const existingCharacters = JSON.parse(scene.characters) as Array<{
      id: string
      position: { x: number; y: number }
      groupId?: string | null
    }>
    const existingGroups = JSON.parse(scene.groups) as Array<{
      id: string
      position: { x: number; y: number }
      width: number
      height: number
    }>

    // Update pokemon positions
    if (body.pokemon && Array.isArray(body.pokemon)) {
      for (const update of body.pokemon) {
        const index = existingPokemon.findIndex(p => p.id === update.id)
        if (index !== -1) {
          existingPokemon[index] = {
            ...existingPokemon[index],
            position: update.position,
            ...(update.groupId !== undefined && { groupId: update.groupId })
          }
        }
      }
    }

    // Update character positions
    if (body.characters && Array.isArray(body.characters)) {
      for (const update of body.characters) {
        const index = existingCharacters.findIndex(c => c.id === update.id)
        if (index !== -1) {
          existingCharacters[index] = {
            ...existingCharacters[index],
            position: update.position,
            ...(update.groupId !== undefined && { groupId: update.groupId })
          }
        }
      }
    }

    // Update group positions
    if (body.groups && Array.isArray(body.groups)) {
      for (const update of body.groups) {
        const index = existingGroups.findIndex(g => g.id === update.id)
        if (index !== -1) {
          existingGroups[index] = {
            ...existingGroups[index],
            position: update.position,
            ...(update.width !== undefined && { width: update.width }),
            ...(update.height !== undefined && { height: update.height })
          }
        }
      }
    }

    // Update scene
    await prisma.scene.update({
      where: { id },
      data: {
        pokemon: JSON.stringify(existingPokemon),
        characters: JSON.stringify(existingCharacters),
        groups: JSON.stringify(existingGroups)
      }
    })

    // Notify WebSocket clients if scene is active
    if (scene.isActive) {
      notifyScenePositionsUpdated(id, {
        pokemon: body.pokemon,
        characters: body.characters,
        groups: body.groups
      })
    }

    return {
      success: true,
      message: 'Positions updated successfully'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update positions'
    })
  }
})
