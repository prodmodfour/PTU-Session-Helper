import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Template ID is required'
      })
    }

    // Check if template exists
    const existing = await prisma.encounterTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Encounter template not found'
      })
    }

    await prisma.encounterTemplate.delete({
      where: { id }
    })

    return { success: true, message: 'Template deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to delete encounter template'
    })
  }
})
