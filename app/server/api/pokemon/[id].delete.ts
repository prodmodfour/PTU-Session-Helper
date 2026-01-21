import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  try {
    await prisma.pokemon.delete({
      where: { id }
    })

    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to delete pokemon'
    })
  }
})
