import { prisma } from '~/server/utils/prisma'
import { serializeCharacter } from '~/server/utils/serializers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  try {
    const character = await prisma.humanCharacter.findUnique({
      where: { id },
      include: { pokemon: true }
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: 'Character not found'
      })
    }

    return { success: true, data: serializeCharacter(character) }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch character'
    })
  }
})
