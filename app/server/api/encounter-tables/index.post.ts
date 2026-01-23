import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.name) {
      throw createError({
        statusCode: 400,
        message: 'Table name is required'
      })
    }

    const table = await prisma.encounterTable.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        imageUrl: body.imageUrl ?? null,
        levelMin: body.levelRange?.min ?? 1,
        levelMax: body.levelRange?.max ?? 10
      },
      include: {
        entries: {
          include: {
            species: true
          }
        },
        modifications: true
      }
    })

    const parsed = {
      id: table.id,
      name: table.name,
      description: table.description,
      imageUrl: table.imageUrl,
      levelRange: {
        min: table.levelMin,
        max: table.levelMax
      },
      entries: [],
      modifications: [],
      createdAt: table.createdAt,
      updatedAt: table.updatedAt
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create encounter table'
    })
  }
})
