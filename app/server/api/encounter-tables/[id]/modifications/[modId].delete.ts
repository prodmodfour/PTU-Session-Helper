import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const tableId = getRouterParam(event, 'id')
  const modId = getRouterParam(event, 'modId')

  if (!tableId) {
    throw createError({
      statusCode: 400,
      message: 'Table ID is required'
    })
  }

  if (!modId) {
    throw createError({
      statusCode: 400,
      message: 'Modification ID is required'
    })
  }

  try {
    // Verify modification exists and belongs to this table
    const existing = await prisma.tableModification.findUnique({
      where: { id: modId }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Modification not found'
      })
    }

    if (existing.parentTableId !== tableId) {
      throw createError({
        statusCode: 400,
        message: 'Modification does not belong to this table'
      })
    }

    // Cascade delete handles entries
    await prisma.tableModification.delete({
      where: { id: modId }
    })

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to delete modification'
    })
  }
})
