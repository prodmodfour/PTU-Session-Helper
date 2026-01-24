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
    const table = await prisma.encounterTable.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            species: true
          }
        },
        modifications: {
          include: {
            entries: true
          }
        }
      }
    })

    if (!table) {
      throw createError({
        statusCode: 404,
        message: 'Encounter table not found'
      })
    }

    const parsed = {
      id: table.id,
      name: table.name,
      description: table.description,
      imageUrl: table.imageUrl,
      levelRange: {
        min: table.levelMin,
        max: table.levelMax
      },
      density: table.density,
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
        description: mod.description,
        levelRange: mod.levelMin && mod.levelMax ? {
          min: mod.levelMin,
          max: mod.levelMax
        } : undefined,
        densityMultiplier: mod.densityMultiplier,
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
      })),
      createdAt: table.createdAt,
      updatedAt: table.updatedAt
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch encounter table'
    })
  }
})
