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

    const template = await prisma.encounterTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Encounter template not found'
      })
    }

    const parsed = {
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
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch encounter template'
    })
  }
})
