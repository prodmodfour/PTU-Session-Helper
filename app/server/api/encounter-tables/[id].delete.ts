import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Table ID is required'
    })
  }

  try {
    // Cascade delete is handled by the schema
    await prisma.encounterTable.delete({
      where: { id }
    })

    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        message: 'Encounter table not found'
      })
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to delete encounter table'
    })
  }
})
