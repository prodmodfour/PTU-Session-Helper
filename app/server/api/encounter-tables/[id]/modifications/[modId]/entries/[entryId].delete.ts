import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const tableId = getRouterParam(event, 'id')
  const modId = getRouterParam(event, 'modId')
  const entryId = getRouterParam(event, 'entryId')

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

  if (!entryId) {
    throw createError({
      statusCode: 400,
      message: 'Entry ID is required'
    })
  }

  try {
    // Verify modification exists and belongs to this table
    const modification = await prisma.tableModification.findUnique({
      where: { id: modId }
    })

    if (!modification) {
      throw createError({
        statusCode: 404,
        message: 'Modification not found'
      })
    }

    if (modification.parentTableId !== tableId) {
      throw createError({
        statusCode: 400,
        message: 'Modification does not belong to this table'
      })
    }

    // Verify entry exists and belongs to this modification
    const entry = await prisma.modificationEntry.findUnique({
      where: { id: entryId }
    })

    if (!entry) {
      throw createError({
        statusCode: 404,
        message: 'Entry not found'
      })
    }

    if (entry.modificationId !== modId) {
      throw createError({
        statusCode: 400,
        message: 'Entry does not belong to this modification'
      })
    }

    await prisma.modificationEntry.delete({
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
