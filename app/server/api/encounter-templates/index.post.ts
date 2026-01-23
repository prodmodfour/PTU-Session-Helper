import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.name) {
      throw createError({
        statusCode: 400,
        message: 'Template name is required'
      })
    }

    const template = await prisma.encounterTemplate.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        battleType: body.battleType ?? 'trainer',
        combatants: JSON.stringify(body.combatants ?? []),
        gridWidth: body.gridConfig?.width ?? null,
        gridHeight: body.gridConfig?.height ?? null,
        gridCellSize: body.gridConfig?.cellSize ?? null,
        category: body.category ?? null,
        tags: JSON.stringify(body.tags ?? [])
      }
    })

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
      message: error.message || 'Failed to create encounter template'
    })
  }
})
