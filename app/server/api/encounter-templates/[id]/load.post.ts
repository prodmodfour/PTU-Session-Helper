import { prisma } from '~/server/utils/prisma'
import type { GridConfig } from '~/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Create a new encounter from a template
 * This is used for the "Load Template" feature
 */
export default defineEventHandler(async (event) => {
  try {
    const templateId = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!templateId) {
      throw createError({
        statusCode: 400,
        message: 'Template ID is required'
      })
    }

    if (!body.name) {
      throw createError({
        statusCode: 400,
        message: 'Encounter name is required'
      })
    }

    // Fetch the template
    const template = await prisma.encounterTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Template not found'
      })
    }

    // Parse template data
    const templateCombatants = JSON.parse(template.combatants) as Array<{
      type: 'pokemon' | 'human'
      side: string
      position: { x: number; y: number } | null
      tokenSize: number
      entityData: any
    }>

    // Determine if grid should be enabled
    const gridEnabled = template.gridWidth !== null && template.gridHeight !== null

    // Convert template combatants to encounter combatants format
    // Each combatant needs a unique ID and default combat state
    const combatants = templateCombatants.map(tc => ({
      id: uuidv4(),
      type: tc.type,
      side: tc.side,
      position: tc.position,
      tokenSize: tc.tokenSize || 1,
      entity: tc.entityData ? {
        id: uuidv4(),
        ...tc.entityData,
        // Add defaults for Pokemon
        ...(tc.type === 'pokemon' ? {
          currentHp: tc.entityData.level ? 10 + tc.entityData.level * 3 : 30,
          maxHp: tc.entityData.level ? 10 + tc.entityData.level * 3 : 30,
          tempHp: 0,
          injuries: { count: 0, max: 5 }
        } : {}),
        // Add defaults for Human
        ...(tc.type === 'human' ? {
          currentHp: tc.entityData.level ? 10 + tc.entityData.level * 2 : 20,
          maxHp: tc.entityData.level ? 10 + tc.entityData.level * 2 : 20,
          tempHp: 0,
          injuries: { count: 0, max: 5 }
        } : {})
      } : null,
      // Default combat state
      initiative: 0,
      initiativeBonus: 0,
      hasActed: false,
      turnState: {
        hasActed: false,
        standardActionUsed: false,
        shiftActionUsed: false,
        swiftActionUsed: false
      },
      combatStages: {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0
      },
      statusConditions: [],
      injuries: { count: 0, max: 5 }
    }))

    // Create the encounter
    const encounter = await prisma.encounter.create({
      data: {
        name: body.name,
        battleType: template.battleType === 'trainer' || template.battleType === 'full_contact'
          ? template.battleType
          : 'trainer',
        combatants: JSON.stringify(combatants),
        currentRound: 1,
        currentTurnIndex: 0,
        turnOrder: '[]',
        isActive: false,
        isPaused: false,
        isServed: false,
        gridEnabled,
        gridWidth: template.gridWidth ?? 20,
        gridHeight: template.gridHeight ?? 15,
        gridCellSize: template.gridCellSize ?? 40,
        gridBackground: null,
        moveLog: '[]',
        defeatedEnemies: '[]'
      }
    })

    // Parse the encounter for response
    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
      combatants: JSON.parse(encounter.combatants),
      currentRound: encounter.currentRound,
      currentTurnIndex: encounter.currentTurnIndex,
      turnOrder: JSON.parse(encounter.turnOrder),
      currentPhase: 'pokemon' as const,
      trainerTurnOrder: [],
      pokemonTurnOrder: [],
      isActive: encounter.isActive,
      isPaused: encounter.isPaused,
      isServed: encounter.isServed,
      gridConfig: {
        enabled: encounter.gridEnabled,
        width: encounter.gridWidth,
        height: encounter.gridHeight,
        cellSize: encounter.gridCellSize,
        background: encounter.gridBackground ?? undefined
      } as GridConfig,
      sceneNumber: 1,
      moveLog: [],
      defeatedEnemies: []
    }

    return {
      success: true,
      data: parsed
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Failed to create encounter from template:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create encounter from template'
    })
  }
})
