import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const tables = await prisma.encounterTable.findMany({
      include: {
        entries: {
          include: {
            species: true
          }
        },
        modifications: true
      },
      orderBy: { name: 'asc' }
    })

    const parsed = tables.map(table => ({
      id: table.id,
      name: table.name,
      description: table.description,
      imageUrl: table.imageUrl,
      levelRange: {
        min: table.levelMin,
        max: table.levelMax
      },
      entries: table.entries.map(entry => ({
        id: entry.id,
        speciesId: entry.speciesId,
        speciesName: entry.species.name,
        weight: entry.weight,
        levelRange: entry.levelMin && entry.levelMax ? {
          min: entry.levelMin,
          max: entry.levelMax
        } : undefined
      })),
      modifications: table.modifications.map(mod => ({
        id: mod.id,
        name: mod.name,
        description: mod.description
      })),
      createdAt: table.createdAt,
      updatedAt: table.updatedAt
    }))

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch encounter tables'
    })
  }
})
