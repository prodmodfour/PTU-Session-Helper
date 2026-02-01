import { prisma } from '~/server/utils/prisma'
import { notifySceneGroupDeleted } from '~/server/utils/websocket'

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
    const existingGroups = JSON.parse(scene.groups) as Array<{ id: string }>

    // Find and remove the group
    const groupIndex = existingGroups.findIndex(g => g.id === groupId)

    if (groupIndex === -1) {
      throw createError({
        statusCode: 404,
        message: 'Group not found in scene'
      })
    }

    existingGroups.splice(groupIndex, 1)

    // Also remove groupId from all pokemon and characters in this group
    const pokemon = JSON.parse(scene.pokemon) as Array<{ groupId?: string | null }>
    const characters = JSON.parse(scene.characters) as Array<{ groupId?: string | null }>

    const updatedPokemon = pokemon.map(p =>
      p.groupId === groupId ? { ...p, groupId: null } : p
    )
    const updatedCharacters = characters.map(c =>
      c.groupId === groupId ? { ...c, groupId: null } : c
    )

    // Update scene
    await prisma.scene.update({
      where: { id },
      data: {
        groups: JSON.stringify(existingGroups),
        pokemon: JSON.stringify(updatedPokemon),
        characters: JSON.stringify(updatedCharacters)
      }
    })

    // Notify WebSocket clients if scene is active
    if (scene.isActive) {
      notifySceneGroupDeleted(id, groupId)
    }

    return {
      success: true,
      message: 'Group deleted from scene'
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to delete group from scene'
    console.error('Error deleting group from scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
