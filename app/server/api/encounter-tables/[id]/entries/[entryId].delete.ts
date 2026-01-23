import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const tableId = getRouterParam(event, 'id')
  const entryId = getRouterParam(event, 'entryId')

  if (!tableId) {
    throw createError({
      statusCode: 400,
      message: 'Table ID is required'
    })
  }

  if (!entryId) {
    throw createError({
      statusCode: 400,
      message: 'Entry ID is required'
    })
  }

  try {
    // Verify entry exists and belongs to this table
    const entry = await prisma.encounterTableEntry.findUnique({
      where: { id: entryId }
    })

    if (!entry) {
      throw createError({
        statusCode: 404,
        message: 'Entry not found'
      })
    }

    if (entry.tableId !== tableId) {
      throw createError({
        statusCode: 400,
        message: 'Entry does not belong to this table'
      })
    }

    await prisma.encounterTableEntry.delete({
      where: { id: entryId }
    })

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to delete entry'
    })
  }
})
