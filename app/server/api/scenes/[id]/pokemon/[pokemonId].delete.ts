import { prisma } from '~/server/utils/prisma'
import { notifyScenePokemonRemoved } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const pokemonId = getRouterParam(event, 'pokemonId')

    if (!id || !pokemonId) {
      throw createError({
        statusCode: 400,
        message: 'Scene ID and Pokemon ID are required'
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

    // Parse existing pokemon
    const existingPokemon = JSON.parse(scene.pokemon) as Array<{ id: string }>

    // Find and remove the pokemon
    const index = existingPokemon.findIndex(p => p.id === pokemonId)

    if (index === -1) {
      throw createError({
        statusCode: 404,
        message: 'Pokemon not found in scene'
      })
    }

    existingPokemon.splice(index, 1)

    // Update scene
    await prisma.scene.update({
      where: { id },
      data: { pokemon: JSON.stringify(existingPokemon) }
    })

    // Notify WebSocket clients if scene is active
    if (scene.isActive) {
      notifyScenePokemonRemoved(id, pokemonId)
    }

    return {
      success: true,
      message: 'Pokemon removed from scene'
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to remove pokemon from scene'
    console.error('Error removing pokemon from scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
