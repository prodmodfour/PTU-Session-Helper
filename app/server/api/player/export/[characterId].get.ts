import { readFileSync } from 'fs'
import { resolve } from 'path'
import { prisma } from '~/server/utils/prisma'
import { serializeCharacter, serializePokemon } from '~/server/utils/serializers'

// Read version from package.json once at startup
const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'))
const APP_VERSION: string = packageJson.version || '0.0.0'

/**
 * GET /api/player/export/:characterId
 *
 * Exports a full character + all owned Pokemon as a JSON blob.
 * Includes metadata (exportedAt, appVersion) for import validation.
 * Used by the Player View for offline data portability.
 */
export default defineEventHandler(async (event) => {
  const characterId = getRouterParam(event, 'characterId')

  if (!characterId) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  try {
    const character = await prisma.humanCharacter.findUnique({
      where: { id: characterId },
      include: { pokemon: true }
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: 'Character not found'
      })
    }

    const serializedCharacter = serializeCharacter(character)
    const serializedPokemon = character.pokemon.map(serializePokemon)

    return {
      success: true,
      data: {
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        appVersion: APP_VERSION,
        character: {
          ...serializedCharacter,
          pokemon: undefined
        },
        pokemon: serializedPokemon
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to export character data'
    })
  }
})
