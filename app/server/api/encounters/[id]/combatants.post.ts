import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { buildEncounterResponse } from '~/server/services/encounter.service'
import { sizeToTokenSize, buildOccupiedCellsSet, findPlacementPosition } from '~/server/services/grid-placement.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    // Get the entity data
    let entity: any
    let tokenSize = 1
    if (body.entityType === 'pokemon') {
      entity = await prisma.pokemon.findUnique({ where: { id: body.entityId } })
      if (!entity) {
        throw createError({ statusCode: 404, message: 'Pokemon not found' })
      }
      // Parse JSON fields
      const capabilities = entity.capabilities ? JSON.parse(entity.capabilities) : {}
      tokenSize = sizeToTokenSize(capabilities.size)

      entity = {
        id: entity.id,
        species: entity.species,
        nickname: entity.nickname,
        level: entity.level,
        types: entity.type2 ? [entity.type1, entity.type2] : [entity.type1],
        currentStats: {
          hp: entity.currentHp,
          attack: entity.currentAttack,
          defense: entity.currentDefense,
          specialAttack: entity.currentSpAtk,
          specialDefense: entity.currentSpDef,
          speed: entity.currentSpeed
        },
        currentHp: entity.currentHp,
        maxHp: entity.maxHp,
        stageModifiers: JSON.parse(entity.stageModifiers),
        abilities: JSON.parse(entity.abilities),
        moves: JSON.parse(entity.moves),
        statusConditions: JSON.parse(entity.statusConditions),
        capabilities,
        spriteUrl: entity.spriteUrl,
        shiny: entity.shiny
      }
    } else {
      entity = await prisma.humanCharacter.findUnique({ where: { id: body.entityId } })
      if (!entity) {
        throw createError({ statusCode: 404, message: 'Character not found' })
      }
      entity = {
        id: entity.id,
        name: entity.name,
        level: entity.level,
        stats: {
          hp: entity.hp,
          attack: entity.attack,
          defense: entity.defense,
          specialAttack: entity.specialAttack,
          specialDefense: entity.specialDefense,
          speed: entity.speed
        },
        currentHp: entity.currentHp,
        maxHp: entity.hp,
        stageModifiers: JSON.parse(entity.stageModifiers),
        statusConditions: JSON.parse(entity.statusConditions),
        avatarUrl: entity.avatarUrl
      }
    }

    // Calculate initiative
    const speed = body.entityType === 'pokemon'
      ? entity.currentStats.speed
      : entity.stats.speed
    const initiative = speed + (body.initiativeBonus || 0)

    // Calculate evasion from stats (PTU: floor(stat / 5))
    const stats = body.entityType === 'pokemon' ? entity.currentStats : entity.stats
    const physicalEvasion = Math.floor((stats.defense || 0) / 5)
    const specialEvasion = Math.floor((stats.specialDefense || 0) / 5)
    const speedEvasion = Math.floor((stats.speed || 0) / 5)

    // Get existing combatants to calculate position
    const combatants = JSON.parse(encounter.combatants)
    const gridWidth = encounter.gridWidth || 20
    const gridHeight = encounter.gridHeight || 15

    // Auto-place on grid
    const occupiedCells = buildOccupiedCellsSet(combatants)
    const position = findPlacementPosition(occupiedCells, body.side, tokenSize, gridWidth, gridHeight)

    // Create combatant with position
    const newCombatant = {
      id: uuidv4(),
      type: body.entityType,
      entityId: body.entityId,
      side: body.side,
      initiative,
      initiativeBonus: body.initiativeBonus || 0,
      hasActed: false,
      actionsRemaining: 2,
      shiftActionsRemaining: 1,
      readyAction: null,
      physicalEvasion,
      specialEvasion,
      speedEvasion,
      position,
      tokenSize,
      entity
    }

    combatants.push(newCombatant)

    await prisma.encounter.update({
      where: { id },
      data: { combatants: JSON.stringify(combatants) }
    })

    const response = buildEncounterResponse(encounter, combatants)

    return { success: true, data: response }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to add combatant'
    })
  }
})
