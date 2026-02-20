/**
 * Create a new encounter from a template.
 * Pokemon combatants get real DB records (origin: 'template').
 * Human combatants remain inline-only (no entityId, no DB sync).
 */
import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import type { GridConfig } from '~/types'
import { generateAndCreatePokemon, buildPokemonCombatant } from '~/server/services/pokemon-generator.service'
import { initialEvasion } from '~/server/services/combatant.service'

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

    // Convert template combatants to encounter combatants
    const combatants: unknown[] = []

    for (const tc of templateCombatants) {
      if (tc.type === 'pokemon' && tc.entityData?.species) {
        // Pokemon combatants: create real DB records via the generator service
        // Pass stored moves/abilities as overrides to preserve template's saved data
        const overrideMoves = tc.entityData.moves
          ? (Array.isArray(tc.entityData.moves) ? tc.entityData.moves : JSON.parse(tc.entityData.moves))
          : undefined
        const overrideAbilities = tc.entityData.abilities
          ? (Array.isArray(tc.entityData.abilities) ? tc.entityData.abilities : JSON.parse(tc.entityData.abilities))
          : undefined

        const created = await generateAndCreatePokemon({
          speciesName: tc.entityData.species,
          level: tc.entityData.level ?? 1,
          nickname: tc.entityData.nickname ?? null,
          origin: 'template',
          originLabel: `Template: ${template.name}`,
          overrideMoves: overrideMoves?.length > 0 ? overrideMoves : undefined,
          overrideAbilities: overrideAbilities?.length > 0 ? overrideAbilities : undefined
        })

        const combatant = buildPokemonCombatant(
          created,
          tc.side,
          tc.position ?? undefined
        )
        combatants.push(combatant)
      } else {
        // Human combatants: inline-only (no DB sync), but still need entityId per Combatant type
        const level = tc.entityData?.level ?? 1
        const baseSpeed = tc.entityData?.stats?.speed ?? 5
        const baseDefense = tc.entityData?.stats?.defense ?? 5
        const baseSpDef = tc.entityData?.stats?.specialDefense ?? 5
        const hpStat = tc.entityData?.stats?.hp ?? 10
        const maxHp = (level * 2) + (hpStat * 3) + 10
        const entityId = uuidv4()

        combatants.push({
          id: uuidv4(),
          type: tc.type,
          entityId,
          side: tc.side,
          position: tc.position,
          tokenSize: tc.tokenSize || 1,
          entity: tc.entityData ? {
            id: entityId,
            ...tc.entityData,
            currentHp: maxHp,
            maxHp: maxHp,
            temporaryHp: 0,
            injuries: 0,
            stageModifiers: {
              attack: 0, defense: 0, specialAttack: 0,
              specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
            },
            statusConditions: []
          } : null,
          initiative: baseSpeed,
          initiativeBonus: 0,
          hasActed: false,
          actionsRemaining: 2,
          shiftActionsRemaining: 1,
          turnState: {
            hasActed: false,
            standardActionUsed: false,
            shiftActionUsed: false,
            swiftActionUsed: false,
            canBeCommanded: true,
            isHolding: false
          },
          injuries: { count: 0, sources: [] },
          physicalEvasion: initialEvasion(baseDefense),
          specialEvasion: initialEvasion(baseSpDef),
          speedEvasion: initialEvasion(baseSpeed)
        })
      }
    }

    // Create the encounter
    const encounter = await prisma.encounter.create({
      data: {
        name: body.name || template.name,
        battleType: ['trainer', 'full_contact', 'wild'].includes(template.battleType)
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
