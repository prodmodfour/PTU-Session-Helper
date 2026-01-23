import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Template ID is required'
      })
    }

    // Check if template exists
    const existing = await prisma.encounterTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Encounter template not found'
      })
    }

    // Build update data
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.battleType !== undefined) updateData.battleType = body.battleType
    if (body.combatants !== undefined) updateData.combatants = JSON.stringify(body.combatants)
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags)

    // Handle grid config
    if (body.gridConfig !== undefined) {
      if (body.gridConfig === null) {
        updateData.gridWidth = null
        updateData.gridHeight = null
        updateData.gridCellSize = null
      } else {
        updateData.gridWidth = body.gridConfig.width ?? null
        updateData.gridHeight = body.gridConfig.height ?? null
        updateData.gridCellSize = body.gridConfig.cellSize ?? null
      }
    }

    const template = await prisma.encounterTemplate.update({
      where: { id },
      data: updateData
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
      message: error.message || 'Failed to update encounter template'
    })
  }
})
