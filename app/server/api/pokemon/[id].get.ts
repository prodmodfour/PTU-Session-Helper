import { prisma } from '~/server/utils/prisma'
import { serializePokemon } from '~/server/utils/serializers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  try {
    const pokemon = await prisma.pokemon.findUnique({
      where: { id }
    })

    if (!pokemon) {
      throw createError({
        statusCode: 404,
        message: 'Pokemon not found'
      })
    }

    return { success: true, data: serializePokemon(pokemon) }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch pokemon'
    })
  }
})
