import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const tableId = getRouterParam(event, 'id')

  if (!tableId) {
    throw createError({
      statusCode: 400,
      message: 'Table ID is required'
    })
  }

  try {
    // Verify table exists
    const table = await prisma.encounterTable.findUnique({
      where: { id: tableId }
    })

    if (!table) {
      throw createError({
        statusCode: 404,
        message: 'Encounter table not found'
      })
    }

    const modifications = await prisma.tableModification.findMany({
      where: { parentTableId: tableId },
      include: {
        entries: true
      },
      orderBy: { name: 'asc' }
    })

    const parsed = modifications.map(mod => ({
      id: mod.id,
      name: mod.name,
      description: mod.description,
      levelRange: mod.levelMin && mod.levelMax ? {
        min: mod.levelMin,
        max: mod.levelMax
      } : undefined,
      entries: mod.entries.map(e => ({
        id: e.id,
        speciesName: e.speciesName,
        weight: e.weight,
        remove: e.remove,
        levelRange: e.levelMin && e.levelMax ? {
          min: e.levelMin,
          max: e.levelMax
        } : undefined
      }))
    }))

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch modifications'
    })
  }
})
