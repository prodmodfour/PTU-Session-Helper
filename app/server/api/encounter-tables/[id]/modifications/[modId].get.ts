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
    const modification = await prisma.tableModification.findUnique({
      where: { id: modId },
      include: {
        entries: true
      }
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

    const parsed = {
      id: modification.id,
      name: modification.name,
      description: modification.description,
      levelRange: modification.levelMin && modification.levelMax ? {
        min: modification.levelMin,
        max: modification.levelMax
      } : undefined,
      entries: modification.entries.map(e => ({
        id: e.id,
        speciesName: e.speciesName,
        weight: e.weight,
        remove: e.remove,
        levelRange: e.levelMin && e.levelMax ? {
          min: e.levelMin,
          max: e.levelMax
        } : undefined
      }))
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch modification'
    })
  }
})
