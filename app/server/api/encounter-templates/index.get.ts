import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const category = query.category as string | undefined
    const search = query.search as string | undefined

    const where: any = {}

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const templates = await prisma.encounterTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })

    const parsed = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      battleType: template.battleType,
      combatants: JSON.parse(template.combatants),
      gridConfig: template.gridWidth ? {
        width: template.gridWidth,
        height: template.gridHeight,
        cellSize: template.gridCellSize
      } : null,
      category: template.category,
      tags: JSON.parse(template.tags),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }))

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch encounter templates'
    })
  }
})
