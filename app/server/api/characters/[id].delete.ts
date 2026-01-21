import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  try {
    // First, unlink any pokemon
    await prisma.pokemon.updateMany({
      where: { ownerId: id },
      data: { ownerId: null }
    })

    // Then delete the character
    await prisma.humanCharacter.delete({
      where: { id }
    })

    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to delete character'
    })
  }
})
