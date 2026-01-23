import { prisma } from '~/server/utils/prisma'

/**
 * Create a new encounter template from an existing encounter
 * This is used for the "Save as Template" feature
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.encounterId) {
      throw createError({
        statusCode: 400,
        message: 'Encounter ID is required'
      })
    }

    if (!body.name) {
      throw createError({
        statusCode: 400,
        message: 'Template name is required'
      })
    }

    // Fetch the encounter
    const encounter = await prisma.encounter.findUnique({
      where: { id: body.encounterId }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    // Parse combatants from JSON
    const encounterCombatants = JSON.parse(encounter.combatants) as Array<{
      id: string
      type: 'pokemon' | 'human'
      side: string
      position: { x: number; y: number } | null
      tokenSize: number
      entity: any
    }>

    // Serialize combatants for the template
    // We store the essential data needed to recreate the encounter
    const combatantData = encounterCombatants.map(c => ({
      type: c.type,
      side: c.side,
      position: c.position,
      tokenSize: c.tokenSize || 1,
      // Store entity reference info
      entityData: c.entity ? (c.type === 'pokemon' ? {
        species: c.entity.species,
        nickname: c.entity.nickname ?? null,
        level: c.entity.level ?? 1,
        nature: c.entity.nature ?? 'Hardy',
        abilities: c.entity.abilities ?? '[]',
        moves: c.entity.moves ?? '[]',
        shiny: c.entity.shiny ?? false,
        gender: c.entity.gender ?? 'Genderless'
      } : {
        name: c.entity.name ?? 'Unknown',
        characterType: c.entity.characterType ?? 'npc',
        level: c.entity.level ?? 1,
        trainerClasses: c.entity.trainerClasses ?? '[]'
      }) : null
    }))

    // Create the template
    const template = await prisma.encounterTemplate.create({
      data: {
        name: body.name,
        description: body.description ?? `Created from encounter: ${encounter.name}`,
        battleType: encounter.battleType,
        combatants: JSON.stringify(combatantData),
        gridWidth: encounter.gridEnabled ? encounter.gridWidth : null,
        gridHeight: encounter.gridEnabled ? encounter.gridHeight : null,
        gridCellSize: encounter.gridEnabled ? encounter.gridCellSize : null,
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
      message: error.message || 'Failed to create template from encounter'
    })
  }
})
