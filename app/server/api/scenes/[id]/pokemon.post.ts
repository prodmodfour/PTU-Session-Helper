import { randomUUID } from 'crypto'
import { prisma } from '~/server/utils/prisma'
import { notifyScenePokemonAdded } from '~/server/utils/websocket'

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

    if (!body.species) {
      throw createError({
        statusCode: 400,
        message: 'Pokemon species is required'
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
    const existingPokemon = JSON.parse(scene.pokemon) as Array<{
      id: string
      speciesId?: string
      species: string
      level: number
      nickname?: string | null
      position: { x: number; y: number }
      groupId?: string | null
    }>

    // Create new pokemon entry
    const newPokemon = {
      id: randomUUID(),
      speciesId: body.speciesId,
      species: body.species,
      level: body.level ?? 1,
      nickname: body.nickname ?? null,
      position: body.position ?? { x: 50, y: 50 },
      groupId: body.groupId ?? null
    }

    // Add to array
    existingPokemon.push(newPokemon)

    // Update scene
    await prisma.scene.update({
      where: { id },
      data: { pokemon: JSON.stringify(existingPokemon) }
    })

    // Notify WebSocket clients if scene is active
    if (scene.isActive) {
      notifyScenePokemonAdded(id, newPokemon)
    }

    return {
      success: true,
      data: newPokemon
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to add pokemon to scene'
    })
  }
})
